'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getItemDetails, notifyOwner } from '@/app/actions/item'; // Import notifyOwner
import { createClaim } from '@/app/actions/claim';
import { Loader2, MapPin, Calendar, Tag, User, Phone, Mail, ArrowLeft, Image as ImageIcon, CheckCircle, AlertCircle, X, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function ItemDetails() {
    const params = useParams();
    const router = useRouter();
    const { data: session, status } = useSession();
    const [item, setItem] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // Claim State
    const [isClaiming, setIsClaiming] = useState(false);
    const [proof, setProof] = useState('');

    // Notify State (For "I found this")
    const [isNotifying, setIsNotifying] = useState(false);
    const [notifyMessage, setNotifyMessage] = useState('');

    const [submitting, setSubmitting] = useState(false);

    // Route Protection
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push(`/login?callbackUrl=/item/${params.id}`);
        }
    }, [status, router, params.id]);

    useEffect(() => {
        const fetchItem = async () => {
            if (params.id) {
                const data = await getItemDetails(Number(params.id));
                setItem(data);
                setLoading(false);
            }
        };
        fetchItem();
    }, [params.id]);

    const handleClaimSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!proof.trim()) return;

        setSubmitting(true);
        const result = await createClaim(item.reports[0].id, proof);

        if (result.success) {
            alert(result.message);
            setIsClaiming(false);
            // Refresh data
            const data = await getItemDetails(Number(params.id));
            setItem(data);
        } else {
            alert(result.error);
        }
        setSubmitting(false);
    };

    const handleNotifySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notifyMessage.trim()) return;

        setSubmitting(true);
        const result = await notifyOwner(Number(params.id), notifyMessage);

        if (result.success) {
            alert(result.message);
            setIsNotifying(false);
            setNotifyMessage('');
        } else {
            alert(result.error);
        }
        setSubmitting(false);
    };

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (status === 'unauthenticated') return null;

    if (!item) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
                <h2 className="text-2xl font-bold mb-4">Item not found</h2>
                <Link href="/" className="text-blue-600 hover:underline">Back to Home</Link>
            </div>
        );
    }

    const report = item.reports[0];
    const user = report?.user;

    // Check Claim Status
    const myClaim = session?.user ? report.claims?.find((c: any) => c.claimerId === Number(session.user.id)) : null;
    const isReporter = session?.user?.email === user?.email;
    const isFoundItem = report?.status === 'found';
    const isClaimed = report?.status === 'claimed';

    return (
        <div className="container mx-auto px-4 py-12 relative">
            <Link href="/" className="inline-flex items-center text-gray-500 hover:text-blue-600 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Image Section */}
                <div className="space-y-6">
                    <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200 relative group shadow-sm">
                        {item.imagePath ? (
                            <img
                                src={item.imagePath.startsWith('http') ? item.imagePath : `/uploads/${item.imagePath}`}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-50">
                                <ImageIcon className="w-16 h-16 text-gray-300" />
                            </div>
                        )}
                        <div className={`absolute top-4 left-4 px-4 py-1.5 rounded-full text-sm font-bold shadow-sm ${isFoundItem ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isFoundItem ? 'Found Item' : 'Lost Item'}
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <div className="space-y-8">
                    <div>
                        <div className="flex items-center justify-between">
                            <h1 className="text-4xl font-bold text-gray-900 mb-2">{item.name}</h1>
                            {isClaimed && <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">Claimed</span>}
                        </div>
                        <p className="text-gray-500 text-lg">{item.description}</p>
                    </div>

                    <div className="card-premium p-6 bg-white space-y-4">
                        <div className="flex items-center gap-3 text-gray-700">
                            <Tag className="w-5 h-5 text-blue-500 shrink-0" />
                            <span className="font-medium">Category:</span> {item.category}
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <MapPin className="w-5 h-5 text-red-500 shrink-0" />
                            <span className="font-medium">Location:</span> {report?.location || 'Unknown'}
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Calendar className="w-5 h-5 text-orange-500 shrink-0" />
                            <span className="font-medium">Date:</span> {report?.date || 'Unknown'}
                        </div>
                    </div>

                    {/* Contact Info */}
                    {user && (
                        <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Contact Reporter
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-blue-800">
                                    <span className="font-semibold">{user.name}</span>
                                </div>
                                {user.email && (
                                    <div className="flex items-center gap-3 text-blue-700">
                                        <Mail className="w-4 h-4 opacity-75" />
                                        <a href={`mailto:${user.email}`} className="hover:underline">{user.email}</a>
                                    </div>
                                )}
                                {user.phone && (
                                    <div className="flex items-center gap-3 text-blue-700">
                                        <Phone className="w-4 h-4 opacity-75" />
                                        <a href={`tel:${user.phone}`} className="hover:underline">{user.phone}</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        {isFoundItem && !isReporter && !isClaimed && (
                            <>
                                {myClaim ? (
                                    <div className={`w-full py-4 text-center rounded-lg font-bold border ${myClaim.status === 'pending' ? 'bg-yellow-50 border-yellow-200 text-yellow-700' :
                                        myClaim.status === 'rejected' ? 'bg-red-50 border-red-200 text-red-700' :
                                            'bg-green-50 border-green-200 text-green-700'
                                        }`}>
                                        {myClaim.status === 'pending' && "Claim Pending Approval"}
                                        {myClaim.status === 'rejected' && "Claim Rejected"}
                                        {myClaim.status === 'approved' && "Claim Approved!"}
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsClaiming(true)}
                                        className="w-full btn-primary py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                    >
                                        This is mine! (Claim)
                                    </button>
                                )}
                            </>
                        )}
                        {!isFoundItem && !isReporter && (
                            <button
                                onClick={() => setIsNotifying(true)}
                                className="flex-1 btn-primary py-4 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-5 h-5" />
                                I found this!
                            </button>
                        )}
                        {isReporter && (
                            <div className="w-full py-3 text-center text-gray-500 text-sm bg-gray-50 rounded-lg">
                                You reported this item.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Claim Modal */}
            {isClaiming && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">Claim Item</h3>
                            <button onClick={() => setIsClaiming(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleClaimSubmit}>
                            <div className="bg-blue-50 p-4 rounded-xl mb-6">
                                <div className="flex gap-3">
                                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-blue-800">
                                        Please provide proof that this item belongs to you. Describe unique features, contents, or circumstances of loss that only the owner would know.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Proof Description <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={proof}
                                    onChange={(e) => setProof(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-32 resize-none"
                                    placeholder="e.g. It has a sticker of a cat on the back, and the wallpaper is..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsClaiming(false)}
                                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                    Submit Claim
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Notify Owner Modal */}
            {isNotifying && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-800">I Found This Item!</h3>
                            <button onClick={() => setIsNotifying(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <form onSubmit={handleNotifySubmit}>
                            <div className="bg-green-50 p-4 rounded-xl mb-6">
                                <div className="flex gap-3">
                                    <MessageCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
                                    <p className="text-sm text-green-800">
                                        Send a message to the owner to let them know you found their item. You can share your contact info or where you left it.
                                    </p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Message to Owner <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={notifyMessage}
                                    onChange={(e) => setNotifyMessage(e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none h-32 resize-none"
                                    placeholder="Hi! I found your item at the library. I left it with the front desk..."
                                    required
                                />
                            </div>

                            <div className="flex gap-3 justify-end">
                                <button
                                    type="button"
                                    onClick={() => setIsNotifying(false)}
                                    className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                                    Send Message
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
