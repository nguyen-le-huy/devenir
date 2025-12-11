"""
FashionCLIP Service - Specialized for Fashion Product Search
Using Zalando's FashionCLIP model fine-tuned on 800K+ fashion images
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import base64
import io
import time
import numpy as np
from PIL import Image
import httpx
from functools import lru_cache

# FashionCLIP imports
from transformers import CLIPModel, CLIPProcessor
import torch

app = FastAPI(
    title="FashionCLIP Image Embedding Service",
    description="Fashion-specialized CLIP for visual product search (512 dims)",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Model configuration - FashionCLIP by Zalando
MODEL_NAME = "patrickjohncyh/fashion-clip"
EMBEDDING_DIMS = 512  # FashionCLIP outputs 512 dimensions

# Global model and processor
model = None
processor = None
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
    """Load FashionCLIP model on startup"""
    global model, processor
    
    print(f"🔄 Loading FashionCLIP model: {MODEL_NAME}...")
    start = time.time()
    
    model = CLIPModel.from_pretrained(MODEL_NAME)
    processor = CLIPProcessor.from_pretrained(MODEL_NAME)
    
    model.to(device)
    model.eval()  # Set to evaluation mode
    
    elapsed = time.time() - start
    print(f"✅ FashionCLIP loaded in {elapsed:.2f}s")
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

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model": "FashionCLIP",
        "model_id": MODEL_NAME,
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
        
        # Preprocess with FashionCLIP processor
        inputs = processor(images=image, return_tensors="pt").to(device)
        
        # Get embedding
        with torch.no_grad():
            image_features = model.get_image_features(**inputs)
            # Normalize
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            embedding = image_features.squeeze().cpu().numpy().tolist()
        
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
                images.append(image)
            except Exception as e:
                print(f"⚠️ Failed to process image: {e}")
                continue
        
        if not images:
            raise HTTPException(status_code=400, detail="No valid images to process")
        
        # Preprocess batch
        inputs = processor(images=images, return_tensors="pt", padding=True).to(device)
        
        # Get embeddings
        with torch.no_grad():
            image_features = model.get_image_features(**inputs)
            # Normalize
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            embeddings = image_features.cpu().numpy().tolist()
        
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
        # Tokenize with FashionCLIP processor
        inputs = processor(text=[request.text], return_tensors="pt", padding=True).to(device)
        
        # Get embedding
        with torch.no_grad():
            text_features = model.get_text_features(**inputs)
            # Normalize
            text_features = text_features / text_features.norm(dim=-1, keepdim=True)
            embedding = text_features.squeeze().cpu().numpy().tolist()
        
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
