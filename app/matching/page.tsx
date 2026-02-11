

import { Link as LinkIcon, ArrowRight, CheckCircle, Clock, MapPin, Calendar } from 'lucide-react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function Matching() {
    // Fetch all active lost and found reports
    const lostReports = await prisma.report.findMany({
        where: { status: 'lost' },
        include: { item: true, user: true }
    });

    const foundReports = await prisma.report.findMany({
        where: { status: 'found' },
        include: { item: true, user: true }
    });

    // Advanced Matching Algorithm
    const matches = [];

    for (const lost of lostReports) {
        for (const found of foundReports) {
            let score = 0;
            const reasons = [];

            // 1. Category Mismatch (Hard Filter)
            if (lost.item.category.toLowerCase() !== found.item.category.toLowerCase()) {
                continue;
            }

            // 2. Date Logic (Hard Filter)
            // Found date cannot be before Lost date
            if (lost.date && found.date && new Date(found.date) < new Date(lost.date)) {
                continue;
            }

            // 3. Name & Brand Similarity (Token Matching)
            const lostTokens = (lost.item.name + " " + (lost.item.brand || "")).toLowerCase().split(/\s+/);
            const foundTokens = (found.item.name + " " + (found.item.brand || "")).toLowerCase().split(/\s+/);

            const commonTokens = lostTokens.filter(token => foundTokens.includes(token));
            if (commonTokens.length > 0) {
                score += commonTokens.length * 15;
                reasons.push(`Similar name/brand keywords: ${commonTokens.join(', ')}`);
            }

            // 4. Color Match
            if (lost.item.color && found.item.color &&
                lost.item.color.toLowerCase() === found.item.color.toLowerCase()) {
                score += 20;
                reasons.push("Color match");
            }

            // 5. Location Proximity (String Matching for now)
            if (lost.location && found.location) {
                const lostLoc = lost.location.toLowerCase();
                const foundLoc = found.location.toLowerCase();
                if (lostLoc.includes(foundLoc) || foundLoc.includes(lostLoc)) {
                    score += 25; // High confidence for location match
                    reasons.push("Location match");
                }
            }

            // 6. Description Analysis
            if (lost.item.description && found.item.description) {
                const lostDescTokens = lost.item.description.toLowerCase().split(/\s+/);
                const foundDescTokens = found.item.description.toLowerCase().split(/\s+/);
                const commonDesc = lostDescTokens.filter(t => foundDescTokens.includes(t) && t.length > 3); // Ignore short words
                if (commonDesc.length > 0) {
                    score += commonDesc.length * 5;
                }
            }

            // Normalize Score to % (Cap at 99%)
            const finalConfidence = Math.min(Math.round(score), 99);

            // Only consider it a match if confidence is reasonably high (> 30%)
            if (finalConfidence > 30) {
                matches.push({
                    id: `${lost.id}-${found.id}`,
                    lostItem: {
                        name: lost.item.name,
                        date: lost.date || 'Unknown',
                        location: lost.location || 'Unknown',
                        color: lost.item.color,
                        brand: lost.item.brand
                    },
                    foundItem: {
                        id: found.item.id,
                        name: found.item.name,
                        date: found.date || 'Unknown',
                        location: found.location || 'Unknown',
                        color: found.item.color,
                        brand: found.item.brand
                    },
                    confidence: finalConfidence,
                    reasons: reasons,
                    status: 'Pending Review'
                });
            }
        }
    }

    // Sort by confidence (highest first)
    matches.sort((a, b) => b.confidence - a.confidence);

    return (
        <div className="container mx-auto px-4 py-12">
            <div className="text-center mb-12">
                <h1 className="text-3xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
                    <LinkIcon className="w-8 h-8 text-blue-500" />
                    Potential <span className="text-blue-500">Matches</span>
                </h1>
                <p className="text-gray-500">Our AI system has identified {matches.length} potential matches based on description, location, and time.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {matches.map((match) => (
                    <div key={match.id} className="card-premium p-6 bg-white flex flex-col h-full animate-in fade-in zoom-in duration-500">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 ${match.confidence > 80 ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                <CheckCircle className="w-3 h-3" /> {match.confidence}% Confidence
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> AI Analysis
                            </span>
                        </div>

                        <div className="flex-1 space-y-4">
                            {/* Lost Item Card */}
                            <div className="p-3 bg-red-50 rounded-lg border border-red-100 relative group">
                                <p className="text-xs font-semibold text-red-500 uppercase mb-1">Lost</p>
                                <h3 className="font-bold text-gray-800">{match.lostItem.name}</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {match.lostItem.location}</div>
                                    <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {match.lostItem.date}</div>
                                    {match.lostItem.color && <div className="text-xs bg-white px-2 py-1 rounded-md inline-block border border-gray-100 mt-1">Color: {match.lostItem.color}</div>}
                                </div>
                            </div>

                            <div className="flex justify-center text-gray-400">
                                <ArrowRight className="w-5 h-5 rotate-90 md:rotate-0" />
                            </div>

                            {/* Found Item Card */}
                            <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                                <p className="text-xs font-semibold text-green-500 uppercase mb-1">Found</p>
                                <h3 className="font-bold text-gray-800">{match.foundItem.name}</h3>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex items-center gap-2"><MapPin className="w-3 h-3" /> {match.foundItem.location}</div>
                                    <div className="flex items-center gap-2"><Calendar className="w-3 h-3" /> {match.foundItem.date}</div>
                                    {match.foundItem.color && <div className="text-xs bg-white px-2 py-1 rounded-md inline-block border border-gray-100 mt-1">Color: {match.foundItem.color}</div>}
                                </div>
                            </div>
                        </div>

                        {/* Match Reasons */}
                        <div className="mt-4 mb-4">
                            <p className="text-xs font-semibold text-gray-500 mb-2">Match Factors:</p>
                            <div className="flex flex-wrap gap-2">
                                {match.reasons.map((reason, idx) => (
                                    <span key={idx} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                                        {reason}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <div className="pt-4 border-t border-gray-100">
                                <Link
                                    href={`/item/${match.foundItem.id}`}
                                    className="w-full btn-primary py-2.5 rounded-lg font-medium flex items-center justify-center gap-2"
                                >
                                    Verify Match
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {matches.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LinkIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-700">No Matches Found</h3>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">
                        Our algorithm hasn't found any strong links between lost and found items yet.
                        Try updating your report with more specific details like color, brand, or location.
                    </p>
                </div>
            )}
        </div>
    );
}
