import BackButton from '../components/BackButton';
import Footer from '../components/Footer';

function Privacy() {
  return (
    <div className='fg-page min-h-screen px-4 py-12'>
      <div className='fg-page-content mx-auto max-w-3xl fg-rise'>
        <BackButton />
        <section className='fg-section mt-8'>
          <p className='fg-kicker text-xs font-semibold uppercase'>Legal</p>
          <h1 className='fg-title mt-4 text-3xl font-black'>Privacy Policy</h1>
          <div className='fg-muted mt-6 space-y-4 text-sm leading-7'>
            <p>
              We collect account data (name, email, location), trip activity, posts, reviews, and
              chat messages needed to run the service.
            </p>
            <p>
              GPS location is only stored when you use GPS features and choose to sync with the
              server. You can stop live tracking at any time in the GPS Navigator.
            </p>
            <p>
              Images may be stored on our servers or Cloudinary when configured. JWT tokens are kept
              in your browser local storage for authentication.
            </p>
            <p>
              We do not sell personal data. Delete your posts and reviews from the app, or contact
              support to request account removal.
            </p>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}

export default Privacy;
