export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-primary text-primary">
      <div className="text-center p-8">
        <h1 className="text-5xl font-bold mb-3">404</h1>
        <p className="text-secondary mb-6">This page could not be found.</p>
        <a href="/" className="btn btn-primary">Go back home</a>
      </div>
    </main>
  );
}


