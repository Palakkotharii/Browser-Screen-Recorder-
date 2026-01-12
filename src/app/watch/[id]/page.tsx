import { getVideo } from '@/lib/storage';
import VideoPlayer from '@/components/VideoPlayer';
import { notFound } from 'next/navigation';

export default async function WatchPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const video = await getVideo(id);

    if (!video) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-8">
            <div className="w-full max-w-4xl flex flex-col gap-8">
                <div className="w-full">
                    <VideoPlayer id={video.id} views={video.views} />
                </div>

                <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-lg mb-2">Metadata</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-gray-500">ID:</span> <span className="font-mono">{video.id}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Created:</span> <span>{new Date(video.createdAt).toLocaleString()}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Completions:</span> <span>{video.completions}</span>
                        </div>
                        <div>
                            <span className="text-gray-500">Completion Rate:</span> <span>{video.views > 0 ? Math.round((video.completions / video.views) * 100) : 0}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
