import { useSearchParams } from 'react-router-dom';

export function JobManualBuilder() {
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'Unknown';

    return (
        <div className="max-w-[1440px] mx-auto animate-fade-in p-8">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">Manual Job Builder</h1>
            <p className="text-[#555555] mb-8">Building: {type}</p>

            <div className="bg-white border border-[#E0E0E0] rounded-xl p-8">
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">Add Supplier</h3>
                <input
                    type="text"
                    placeholder="Search supplier name..."
                    className="w-full max-w-md h-10 px-3 border border-[#E0E0E0] rounded-md text-sm focus:border-[#13B5EA] focus:outline-none"
                />
            </div>
        </div>
    );
}
