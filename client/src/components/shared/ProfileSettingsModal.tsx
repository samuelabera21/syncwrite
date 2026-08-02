import React, { useState, useRef } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { authClient, useSession } from "../../lib/auth-client";
import { Button } from "../ui/Button";
import toast from "react-hot-toast";

interface ProfileSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ProfileSettingsModal({ isOpen, onClose }: ProfileSettingsModalProps) {
    const { data: session } = useSession();
    const [name, setName] = useState(session?.user?.name || "");
    const [imagePreview, setImagePreview] = useState<string | null>(session?.user?.image || null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("File size must be less than 5MB");
                return;
            }
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        
        try {
            let base64Image: string | undefined;

            if (selectedFile) {
                base64Image = imagePreview as string; 
            }

            // Using better-auth updateUser method
            const { error } = await authClient.updateUser({
                name: name,
                ...(base64Image ? { image: base64Image } : {}),
            });

            if (error) {
                toast.error(error.message || "Failed to update profile");
            } else {
                toast.success("Profile updated successfully!");
                onClose();
            }
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <h2 className="text-xl font-semibold text-slate-900">Profile Settings</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="p-6">
                    <div className="flex flex-col items-center mb-6">
                        <div className="relative group">
                            <div className="h-24 w-24 rounded-full border-4 border-indigo-50 bg-indigo-100 flex items-center justify-center overflow-hidden">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <span className="text-3xl font-bold text-indigo-600">
                                        {name ? name[0].toUpperCase() : session?.user?.email[0].toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="absolute bottom-0 right-0 bg-indigo-600 p-2 rounded-full text-white shadow-md hover:bg-indigo-700 transition-colors"
                            >
                                <Upload className="h-4 w-4" />
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/jpeg,image/png,image/gif,image/webp"
                                className="hidden"
                            />
                        </div>
                        <p className="text-xs text-slate-500 mt-2">Click to upload avatar (Max 5MB)</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Display Name
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full rounded-lg border border-slate-200 px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                required
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">
                                Email Address <span className="text-xs text-slate-400 font-normal">(Read Only)</span>
                            </label>
                            <input
                                type="email"
                                value={session?.user?.email || ""}
                                disabled
                                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 text-slate-500"
                            />
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end space-x-3">
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-indigo-600 text-white hover:bg-indigo-700">
                            {isLoading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
