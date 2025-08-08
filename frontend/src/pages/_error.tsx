import { NextPageContext } from 'next';

type ErrorPageProps = {
  statusCode?: number;
};

function ErrorPage({ statusCode }: ErrorPageProps) {
  const message = statusCode
    ? `An error ${statusCode} occurred on server`
    : 'An error occurred on client';

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary text-primary">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold mb-2">Something went wrong</h1>
        <p className="text-secondary mb-6">{message}</p>
        <a href="/" className="btn btn-primary">Go back home</a>
      </div>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;


