'use client';

import { User, Settings, LogOut, Package, Loader2, MessageSquare, Check, X as XIcon, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { getUserReports, getUserIncomingClaims } from '@/app/actions/report';
import { updateClaimStatus } from '@/app/actions/claim';
import Link from 'next/link';

export default function Profile() {
    const { data: session, status } = useSession();
    const [reports, setReports] = useState<any[]>([]);
    const [claims, setClaims] = useState<any[]>([]);
    const [loadingReports, setLoadingReports] = useState(true);
    const [loadingClaims, setLoadingClaims] = useState(true);
    const [processingClaim, setProcessingClaim] = useState<number | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            if (session?.user?.email) {
                // Fetch Reports
                const reportData = await getUserReports(session.user.email);
                setReports(reportData);
                setLoadingReports(false);

                // Fetch Incoming Claims
                const claimData = await getUserIncomingClaims(session.user.email);
                setClaims(claimData);
                setLoadingClaims(false);
            }
        };
        if (status === 'authenticated') {
            fetchData();
        } else if (status === 'unauthenticated') {
            setLoadingReports(false);
            setLoadingClaims(false);
        }
    }, [session, status]);

    const handleClaimAction = async (claimId: number, action: 'approved' | 'rejected') => {
        if (!session?.user?.email) return;
        setProcessingClaim(claimId);

        const res = await updateClaimStatus(claimId, action);

        if (res.success) {
            // Refresh data
            const newClaims = await getUserIncomingClaims(session.user.email);
            setClaims(newClaims);
            // Also refresh reports as status might have changed
            const newReports = await getUserReports(session.user.email);
            setReports(newReports);
        } else {
            alert(res.error);
        }
        setProcessingClaim(null);
    };

    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
    }

    if (!session) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <h2 className="text-xl font-bold">Please sign in to view your profile</h2>
                <Link href="/login" className="btn-primary">Sign In</Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <div className="w-full md:w-1/3">
                        <div className="card-premium bg-white p-6 text-center sticky top-24">
                            <div className="w-24 h-24 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <User className="w-12 h-12 text-gray-400" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-800">{session.user?.name}</h2>
                            <p className="text-gray-500 text-sm mb-6">{session.user?.email}</p>

                            <div className="space-y-2 text-left">
                                <button className="w-full flex items-center gap-3 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg font-medium transition-colors">
                                    <User className="w-4 h-4" /> My Profile
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                                    <Package className="w-4 h-4" /> My Reports
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                                    <MessageSquare className="w-4 h-4" /> Incoming Claims
                                    {claims.some(c => c.status === 'pending') && (
                                        <span className="ml-auto w-2 h-2 bg-red-500 rounded-full"></span>
                                    )}
                                </button>
                                <button className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
                                    <Settings className="w-4 h-4" /> Settings
                                </button>

                                {/* Telegram Integration */}
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">TELEGRAM NOTIFICATIONS</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Chat ID"
                                            className="w-full text-xs p-2 border border-gray-200 rounded-lg"
                                            defaultValue={session.user.telegramChatId || ''}
                                            onBlur={async (e) => {
                                                const { updateTelegramChatId } = await import('@/app/actions/user');
                                                await updateTelegramChatId(e.target.value);
                                            }}
                                        />
                                        <button
                                            onClick={async () => {
                                                const { testTelegramNotification } = await import('@/app/actions/user');
                                                const res = await testTelegramNotification();
                                                alert(res.message || res.error);
                                            }}
                                            className="px-3 py-1 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-200"
                                        >
                                            Test
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Start bot to get ID.
                                    </p>
                                </div>

                                <hr className="my-2 border-gray-100" />
                                <button onClick={() => signOut()} className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg font-medium transition-colors">
                                    <LogOut className="w-4 h-4" /> Sign Out
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="w-full md:w-2/3 space-y-8">
                        {/* Stats/Actions */}
                        <div className="card-premium bg-white p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Report</h2>
                            <div className="flex gap-4">
                                <Link href="/report/lost" className="flex-1 py-3 px-4 bg-red-50 text-red-600 rounded-xl font-semibold text-center hover:bg-red-100 transition-colors">
                                    Report Lost Item
                                </Link>
                                <Link href="/report/found" className="flex-1 py-3 px-4 bg-green-50 text-green-600 rounded-xl font-semibold text-center hover:bg-green-100 transition-colors">
                                    Report Found Item
                                </Link>
                            </div>
                        </div>

                        {/* Incoming Claims Section */}
                        {claims.length > 0 && (
                            <div className="card-premium bg-white p-8 border-l-4 border-l-yellow-400">
                                <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-6 h-6 text-yellow-500" />
                                    Incoming Claims
                                </h2>
                                <p className="text-gray-500 mb-6">People claiming items you verified as found.</p>

                                <div className="space-y-4">
                                    {claims.map((claim) => (
                                        <div key={claim.id} className={`p-4 rounded-xl border ${claim.status === 'pending' ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-100 opacity-75'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold text-gray-800">{claim.claimerName}</span>
                                                        <span className="text-gray-500 text-sm">wants to claim</span>
                                                        <Link href={`/item/${claim.id}`} className="font-bold text-blue-600 hover:underline">{claim.itemName}</Link>
                                                    </div>
                                                    <p className="text-xs text-gray-400">{claim.date}</p>
                                                </div>
                                                <div className={`text-xs font-bold px-2 py-1 rounded-full uppercase ${claim.status === 'pending' ? 'bg-yellow-200 text-yellow-800' :
                                                    claim.status === 'approved' ? 'bg-green-200 text-green-800' :
                                                        'bg-red-200 text-red-800'
                                                    }`}>
                                                    {claim.status}
                                                </div>
                                            </div>

                                            <div className="bg-white p-3 rounded-lg border border-gray-200 mb-4">
                                                <p className="text-xs text-gray-400 uppercase font-bold mb-1">Proof Provided:</p>
                                                <p className="text-gray-700 italic">"{claim.proof}"</p>
                                            </div>

                                            {claim.status === 'pending' && (
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => handleClaimAction(claim.id, 'approved')}
                                                        disabled={processingClaim === claim.id}
                                                        className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                                                    >
                                                        {processingClaim === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                                        Approve Match
                                                    </button>
                                                    <button
                                                        onClick={() => handleClaimAction(claim.id, 'rejected')}
                                                        disabled={processingClaim === claim.id}
                                                        className="flex-1 py-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg font-bold text-sm flex items-center justify-center gap-2"
                                                    >
                                                        {processingClaim === claim.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XIcon className="w-4 h-4" />}
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* My Reports */}
                        <div className="card-premium bg-white p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">My Reports</h2>
                            {loadingReports ? (
                                <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></div>
                            ) : reports.length > 0 ? (
                                <div className="space-y-4">
                                    {reports.map((report) => (
                                        <div key={report.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${report.type === 'Found' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                                {report.type === 'Found' ? '✓' : '!'}
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-gray-800">{report.name}</h4>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>{report.date}</span>
                                                    <span>•</span>
                                                    <span className={`capitalize ${report.status === 'claimed' ? 'text-green-600 font-bold' : ''
                                                        }`}>{report.status}</span>
                                                </div>
                                            </div>
                                            <Link href={`/item/${report.id}`} className="text-sm font-medium text-blue-600 hover:underline">
                                                View
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">You haven't reported any items yet.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
