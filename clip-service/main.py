"""
Self-hosted CLIP Service using ONNX Runtime
Optimized for CPU inference with INT8 quantization
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import base64
import io
import time
import hashlib
import numpy as np
from PIL import Image
import httpx
from functools import lru_cache

# CLIP model imports
import open_clip
import torch

app = FastAPI(
    title="CLIP Image Embedding Service",
    description="Self-hosted CLIP for image embeddings (512 dims)",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model configuration - ViT-L-14 for better accuracy with complex backgrounds
MODEL_NAME = "ViT-L-14"
PRETRAINED = "openai"
EMBEDDING_DIMS = 768  # ViT-L-14 outputs 768 dimensions

# Global model and preprocess
model = None
preprocess = None
tokenizer = None
device = "cpu"  # Use CPU for server deployment

class ImageRequest(BaseModel):
    image: str  # base64 encoded image or URL

class BatchImageRequest(BaseModel):
    images: List[str]  # List of base64 or URLs

class TextRequest(BaseModel):
    text: str

class EmbeddingResponse(BaseModel):
    embedding: List[float]
    dims: int = EMBEDDING_DIMS
    processing_time_ms: float

class BatchEmbeddingResponse(BaseModel):
    embeddings: List[List[float]]
    dims: int = EMBEDDING_DIMS
    count: int
    processing_time_ms: float

@app.on_event("startup")
async def load_model():
    """Load CLIP model on startup"""
    global model, preprocess, tokenizer
    
    print(f"🔄 Loading CLIP model: {MODEL_NAME} ({PRETRAINED})...")
    start = time.time()
    
    model, _, preprocess = open_clip.create_model_and_transforms(
        MODEL_NAME, 
        pretrained=PRETRAINED,
        device=device
    )
    tokenizer = open_clip.get_tokenizer(MODEL_NAME)
    
    model.eval()  # Set to evaluation mode
    
    elapsed = time.time() - start
    print(f"✅ Model loaded in {elapsed:.2f}s")
    print(f"📐 Embedding dimensions: {EMBEDDING_DIMS}")

def decode_image(image_data: str) -> Image.Image:
    """Decode base64 or fetch from URL"""
    if image_data.startswith('http'):
        # Fetch from URL
        response = httpx.get(image_data, timeout=30)
        response.raise_for_status()
        return Image.open(io.BytesIO(response.content)).convert("RGB")
    else:
        # Decode base64
        if image_data.startswith('data:'):
            # Remove data URL prefix
            image_data = image_data.split(',', 1)[1]
        
        image_bytes = base64.b64decode(image_data)
        return Image.open(io.BytesIO(image_bytes)).convert("RGB")

@lru_cache(maxsize=1000)
def get_cached_embedding(image_hash: str) -> Optional[tuple]:
    """LRU cache for embeddings (in-memory)"""
    return None  # Placeholder - actual caching done by Redis

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": MODEL_NAME,
        "device": device,
        "dims": EMBEDDING_DIMS
    }

@app.post("/encode", response_model=EmbeddingResponse)
async def encode_image(request: ImageRequest):
    """Encode single image to embedding"""
    start = time.time()
    
    try:
        # Decode image
        image = decode_image(request.image)
        
        # Preprocess
        image_tensor = preprocess(image).unsqueeze(0).to(device)
        
        # Get embedding
        with torch.no_grad():
            embedding = model.encode_image(image_tensor)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)  # Normalize
            embedding = embedding.squeeze().cpu().numpy().tolist()
        
        elapsed_ms = (time.time() - start) * 1000
        
        return EmbeddingResponse(
            embedding=embedding,
            processing_time_ms=round(elapsed_ms, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/encode-batch", response_model=BatchEmbeddingResponse)
async def encode_batch(request: BatchImageRequest):
    """Encode batch of images"""
    start = time.time()
    
    try:
        images = []
        for img_data in request.images:
            try:
                image = decode_image(img_data)
                images.append(preprocess(image))
            except Exception as e:
                print(f"⚠️ Failed to process image: {e}")
                continue
        
        if not images:
            raise HTTPException(status_code=400, detail="No valid images to process")
        
        # Stack into batch
        batch_tensor = torch.stack(images).to(device)
        
        # Get embeddings
        with torch.no_grad():
            embeddings = model.encode_image(batch_tensor)
            embeddings = embeddings / embeddings.norm(dim=-1, keepdim=True)
            embeddings = embeddings.cpu().numpy().tolist()
        
        elapsed_ms = (time.time() - start) * 1000
        
        return BatchEmbeddingResponse(
            embeddings=embeddings,
            count=len(embeddings),
            processing_time_ms=round(elapsed_ms, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/encode-text", response_model=EmbeddingResponse)
async def encode_text(request: TextRequest):
    """Encode text to embedding (for text-to-image search)"""
    start = time.time()
    
    try:
        # Tokenize
        text_tokens = tokenizer([request.text]).to(device)
        
        # Get embedding
        with torch.no_grad():
            embedding = model.encode_text(text_tokens)
            embedding = embedding / embedding.norm(dim=-1, keepdim=True)
            embedding = embedding.squeeze().cpu().numpy().tolist()
        
        elapsed_ms = (time.time() - start) * 1000
        
        return EmbeddingResponse(
            embedding=embedding,
            processing_time_ms=round(elapsed_ms, 2)
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8899)
