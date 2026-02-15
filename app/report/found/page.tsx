'use client';

import { useState, useEffect } from 'react';
import { Camera, MapPin, Loader2, User, Mail, Phone, Image as ImageIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { submitReport } from '@/app/actions/report';

export default function ReportFound() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login?callbackUrl=/report/found');
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-green-500" />
            </div>
        );
    }

    if (status === 'unauthenticated') {
        return null; // Prevent flash of content
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);

        try {
            // 1. Upload Image if exists
            let imagePath = '';
            if (selectedImage) {
                const uploadFormData = new FormData();
                uploadFormData.append('file', selectedImage);

                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: uploadFormData,
                });

                if (uploadRes.ok) {
                    const data = await uploadRes.json();
                    imagePath = data.path;
                }
            }

            // 2. Submit Report
            const reportData = new FormData();
            reportData.append('itemName', formData.get('name') as string);
            reportData.append('category', formData.get('category') as string);
            reportData.append('description', formData.get('description') as string);
            reportData.append('location', formData.get('location') as string);
            reportData.append('date', formData.get('date') as string);
            reportData.append('status', 'found');
            reportData.append('imagePath', imagePath);

            // User Data
            reportData.append('userName', formData.get('userName') as string);
            reportData.append('userEmail', formData.get('userEmail') as string);
            reportData.append('userPhone', formData.get('userPhone') as string);

            const result = await submitReport(reportData);

            if (result.success) {
                router.push('/');
            } else {
                alert("Failed to submit report. Please try again.");
            }
        } catch (error) {
            console.error(error);
            alert("An error occurred.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-800 mb-4">Report <span className="text-green-500">Found</span> Item</h1>
                    <p className="text-gray-500 text-lg">Thank you for being a good samaritan.</p>
                </div>

                <div className="card-premium p-8 bg-white relative overflow-hidden">
                    {/* Decorative background blob */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-8 -mt-8 z-0"></div>

                    <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
                        {/* Section 1: Item Details */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Item Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        placeholder="e.g. Blue Umbrella"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                    <select name="category" className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all bg-white">
                                        <option value="Electronics">Electronics</option>
                                        <option value="Documents">Documents</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Accessories">Accessories</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                <textarea
                                    name="description"
                                    rows={4}
                                    placeholder="Describe the item securely without revealing too many details..."
                                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                    required
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Location Found</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="location"
                                            placeholder="e.g. Cafeteria Table 5"
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Date Found</label>
                                    <input
                                        type="date"
                                        name="date"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer group relative">
                                    <input
                                        type="file"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    {imagePreview ? (
                                        <div className="relative h-48 w-full">
                                            <img src={imagePreview} alt="Preview" className="h-full w-full object-contain" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">
                                                Change Image
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <Camera className="w-10 h-10 text-gray-300 mx-auto mb-3 group-hover:text-green-400 transition-colors" />
                                            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
                                            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Contact Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Your Contact Information</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="text"
                                            name="userName"
                                            placeholder="Your full name"
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type="email"
                                            name="userEmail"
                                            placeholder="name@example.com"
                                            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
                                <div className="relative">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="tel"
                                        name="userPhone"
                                        placeholder="+1 (555) 000-0000"
                                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" /> Submitting...
                                </>
                            ) : (
                                'Submit Found Report'
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
