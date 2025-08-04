import { getServerSideBaseUrl } from '@/lib/config';

async function checkBackendHealth() {
  try {
    const res = await fetch(`${getServerSideBaseUrl()}/health`, { cache: 'no-store' });
    console.log(res)
    return res.status === 200;

  } catch (error) {
    return false;
  }
}

export default async function Home() {
  const isHealthy = await checkBackendHealth();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans bg-gradient-to-br from-indigo-500 via-purple-500 to-purple-800 text-white">
      {/* Your existing UI */}
      <div >
        <p>Backend Status: {isHealthy ? 'Connected ✅' : 'Disconnected ❌'}</p>
      </div>
    </div>
  );
}