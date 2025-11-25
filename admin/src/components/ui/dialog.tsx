import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

// Dialog Root
export const Dialog = DialogPrimitive.Root

// Dialog Trigger
export const DialogTrigger = DialogPrimitive.Trigger

// Dialog Content
export const DialogContent = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & { side?: "top" | "right" | "bottom" | "left" }
>(
    ({ className, side = "right", children, ...props }, ref) => {
        return (
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay className={cn(
                    "fixed inset-0 z-50 bg-black/50 data-[state=open]:animate-in data-[state=closed]:animate-out",
                    "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
                )} />
                <DialogPrimitive.Content
                    ref={ref}
                    className={cn(
                        "fixed z-50 gap-4 bg-background p-6 shadow-lg transition-all data-[state=open]:animate-in data-[state=closed]:animate-out",
                        side === "right" && "right-0 top-0 h-full w-1/3 max-w-md border-l",
                        side === "left" && "left-0 top-0 h-full w-1/3 max-w-md border-r",
                        side === "top" && "top-0 left-0 w-full h-1/3 max-h-md border-b",
                        side === "bottom" && "bottom-0 left-0 w-full h-1/3 max-h-md border-t",
                        className
                    )}
                    {...props}
                >
                    {children}
                    <DialogPrimitive.Close className="absolute top-2 right-2 rounded-sm opacity-70 hover:opacity-100 focus:outline-none">
                        <XIcon className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        )
    }
)
DialogContent.displayName = "DialogContent"

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col space-y-2 text-center sm:text-left", className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

export const DialogTitle = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Title>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Title
        ref={ref}
        className={cn("text-lg font-semibold leading-none tracking-tight", className)}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

export const DialogDescription = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Description>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
    <DialogPrimitive.Description
        ref={ref}
        className={cn("text-sm text-muted-foreground", className)}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
)
DialogFooter.displayName = "DialogFooter"

export const DialogClose = DialogPrimitive.Close


