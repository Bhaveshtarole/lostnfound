import Link from 'next/link';
import { Search, MapPin, User, Calendar, ArrowRight, ShieldCheck, Award } from 'lucide-react';
import { prisma } from '@/lib/prisma';

// Mock data for initial UI dev (fallback if DB not connected)
const mockStats = { lost: 12, found: 8, claimed: 5, returned: 3 };

interface ItemDisplay {
  id: number;
  name: string;
  location: string;
  date: string;
  image: string | null;
}

const mockRecentLost: ItemDisplay[] = [
  { id: 1, name: 'iPhone 13', location: 'Library', date: '2023-10-01', image: null },
  { id: 2, name: 'Blue Backpack', location: 'Cafeteria', date: '2023-10-02', image: null },
];
const mockRecentFound: ItemDisplay[] = [
  { id: 3, name: 'Keys', location: 'Main Gate', date: '2023-10-03', image: null },
];

async function getStats() {
  try {
    const lost = await prisma.report.count({ where: { status: 'lost' } });
    const found = await prisma.report.count({ where: { status: 'found' } });
    const claimed = await prisma.report.count({ where: { status: 'claimed' } });
    const returned = await prisma.report.count({ where: { status: 'returned' } });
    return { lost, found, claimed, returned };
  } catch (e) {
    return mockStats;
  }
}

async function getRecentReports(status: string): Promise<ItemDisplay[]> {
  try {
    const reports = await prisma.report.findMany({
      where: { status },
      take: 4,
      orderBy: { createdAt: 'desc' },
      include: { item: true }
    });
    return reports.map((r) => ({
      id: r.id,
      name: r.item.name,
      location: r.location || 'Unknown',
      date: r.date || 'Unknown',
      image: r.item.imagePath
    }));
  } catch (e) {
    return status === 'lost' ? mockRecentLost : mockRecentFound;
  }
}

async function getTopFinders() {
  try {
    const topFinders = await prisma.user.findMany({
      where: { finderPoints: { gt: 0 } },
      take: 3,
      orderBy: { finderPoints: 'desc' },
      select: {
        id: true,
        name: true,
        finderPoints: true,
        _count: {
          select: { claims: { where: { status: 'approved' } } }
        }
      }
    });
    return topFinders;
  } catch (e) {
    return [];
  }
}

export default async function Home() {
  const stats = await getStats();
  const recentLost = await getRecentReports('lost');
  const recentFound = await getRecentReports('found');
  const topFinders = await getTopFinders();

  return (
    <main className="min-h-screen pb-12">
      {/* Hero Section */}
      <section className="navbar-gradient text-white py-20 rounded-b-[3rem] shadow-xl mb-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-in slide-in-from-bottom-4 fade-in duration-700">
            Lost Something? <span className="text-yellow-300">We've Got You!</span>
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-2xl mx-auto">
            The smartest way to report and recover lost items on campus.
            Fast, secure, and reliable.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Link
              href="/report/lost"
              className="bg-white text-indigo-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 hover:scale-105 transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" /> I Lost Something
            </Link>
            <Link
              href="/report/found"
              className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-white/10 hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" /> I Found Something
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4">
        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 -mt-24 relative z-20">
          {[
            { label: 'Lost Items', value: stats.lost, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Found Items', value: stats.found, color: 'text-green-500', bg: 'bg-green-50' },
            { label: 'Claimed', value: stats.claimed, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Returned', value: stats.returned, color: 'text-purple-500', bg: 'bg-purple-50' },
          ].map((stat, idx) => (
            <div key={idx} className="card-premium p-6 text-center animate-in zoom-in duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
              <h3 className={`text-4xl font-bold mb-2 ${stat.color}`}>{stat.value}</h3>
              <p className="text-gray-600 font-medium uppercase tracking-wide text-sm">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Recent Lost Items */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Recent <span className="text-red-500">Lost</span> Items</h2>
              <p className="text-gray-500">Help others find their belongings</p>
            </div>
            <Link href="/search?status=lost" className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentLost.map((item) => (
              <div key={item.id} className="card-premium overflow-hidden group">
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  {item.image ? (
                    <img src={item.image!.startsWith('http') ? item.image! : `/uploads/${item.image}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <Search className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm">LOST</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MapPin className="w-4 h-4" /> {item.location}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </div>
                  <Link href={`/item/${item.id}`} className="mt-4 block text-center btn-primary w-full">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Found Items */}
        <section className="mb-16">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-800 mb-2">Recent <span className="text-green-500">Found</span> Items</h2>
              <p className="text-gray-500">Is this yours? Claim it now!</p>
            </div>
            <Link href="/search?status=found" className="text-indigo-600 font-semibold hover:text-indigo-800 flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recentFound.map((item) => (
              <div key={item.id} className="card-premium overflow-hidden group">
                <div className="h-48 bg-gray-200 relative overflow-hidden">
                  {item.image ? (
                    <img src={item.image!.startsWith('http') ? item.image! : `/uploads/${item.image}`} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <ShieldCheck className="w-12 h-12 opacity-20" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-sm">FOUND</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <MapPin className="w-4 h-4" /> {item.location}
                  </div>
                  <div className="flex items-center gap-2 text-gray-400 text-xs">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </div>
                  <Link href={`/item/${item.id}`} className="mt-4 block text-center btn-primary w-full">
                    Claim Item
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Leaderboard */}
        <section className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-yellow-100 p-3 rounded-full text-yellow-600">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Top Finders</h2>
              <p className="text-gray-500">Heroes of our campus</p>
            </div>
          </div>

          <div className="space-y-4">
            {topFinders.length > 0 ? (
              topFinders.map((user, i) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-blue-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : 'bg-orange-300 text-white'}`}>#{i + 1}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold">{user.name}</h4>
                        <p className="text-xs text-gray-500">Hero</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-indigo-600">{user.finderPoints} pts</div>
                    <div className="text-xs text-gray-400">{user._count.claims} claims resolved</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No top finders yet. Be the first to find an item and earn points!</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
