'use client';

import { Users, FileText, CheckSquare, BarChart3, AlertTriangle, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getAdminStats } from '@/app/actions/admin';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (status === 'authenticated' && session?.user?.isAdmin) {
                const data = await getAdminStats();
                setStats(data);
                setLoading(false);
            } else if (status === 'unauthenticated' || (status === 'authenticated' && !session?.user?.isAdmin)) {
                setLoading(false); // Stop loading to show access denied
            }
        };
        fetchStats();
    }, [status, session]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    // Protect Admin Route
    if (session?.user?.isAdmin === false) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-center">
                <AlertTriangle className="w-16 h-16 text-red-500" />
                <h1 className="text-2xl font-bold text-gray-800">Access Denied</h1>
                <p className="text-gray-600">You do not have permission to view this page.</p>
                <Link href="/" className="btn-primary">Return Home</Link>
            </div>
        );
    }

    if (!stats) {
        return <div className="text-center py-12">Failed to load stats.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-8 border-l-4 border-blue-600 pl-4">Admin Dashboard</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <div className="card-premium p-6 bg-white border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Total Reports</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.totalReports}</h3>
                        </div>
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <FileText className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="card-premium p-6 bg-white border-l-4 border-l-green-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Resolved</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.resolvedReports}</h3>
                        </div>
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <CheckSquare className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="card-premium p-6 bg-white border-l-4 border-l-red-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Pending Claims</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.pendingClaims}</h3>
                        </div>
                        <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                <div className="card-premium p-6 bg-white border-l-4 border-l-purple-500">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 uppercase">Users</p>
                            <h3 className="text-3xl font-bold text-gray-800 mt-1">{stats.usersCount}</h3>
                        </div>
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <Users className="w-6 h-6" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h2 className="font-bold text-gray-800 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-gray-500" /> Recent Activity
                    </h2>
                    <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4">Item</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {stats.recentReports.map((report: any) => (
                                <tr key={report.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-800">{report.name}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${report.type === 'Found' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {report.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{report.userEmail}</td>
                                    <td className="px-6 py-4">
                                        <span className={`flex items-center gap-1 ${report.status === 'active' || report.status === 'lost' || report.status === 'found' ? 'text-green-600' : 'text-orange-600'}`}>
                                            <span className={`w-2 h-2 rounded-full ${report.status === 'active' || report.status === 'lost' || report.status === 'found' ? 'bg-green-600' : 'bg-orange-600'}`}></span>
                                            {report.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500">{report.date}</td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Link href={`/item/${report.id}`} className="text-blue-600 hover:underline px-2 py-1">View</Link>
                                            <DeleteButton itemId={report.id} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Separate component for Delete Button to handle client-side logic cleanly
function DeleteButton({ itemId }: { itemId: number }) {
    const [isDeleting, setIsDeleting] = useState(false);
    // Import dynamically to avoid server/client conflicts if needed, but here we are in a 'use client' file
    const { deleteReport } = require('@/app/actions/admin');

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to permanently delete this item and all its data?")) return;

        setIsDeleting(true);
        const result = await deleteReport(itemId);

        if (result.success) {
            // Force reload to update UI since we don't have global state management for this table
            window.location.reload();
        } else {
            alert(result.error || "Failed to delete");
            setIsDeleting(false);
        }
    };

    return (
        <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="text-red-600 hover:bg-red-50 px-2 py-1 rounded transition-colors disabled:opacity-50"
        >
            {isDeleting ? '...' : 'Delete'}
        </button>
    );
}
