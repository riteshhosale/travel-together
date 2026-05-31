import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import EmptyState from '../components/EmptyState';
import Footer from '../components/Footer';
import SectionHeader from '../components/SectionHeader';
import { apiFetch } from '../services/apiFetch';
import { notify } from '../services/notify';
import { getBackendBase } from '../services/backendBase';
import { getUserIdFromToken } from '../utils/userId';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

const resolveImageUrl = (image) => {
  if (!image) return '';

  const trimmed = String(image).trim();

  if (!trimmed) return '';

  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }

  const backendBase = getBackendBase();

  if (trimmed.startsWith('/uploads/')) {
    return `${backendBase}${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `${backendBase}/${trimmed}`;
  }

  return trimmed;
};

function Feed() {
  const currentUserId = getUserIdFromToken();
  const [searchParams] = useSearchParams();
  const featureName = searchParams.get('feature') || 'Community Feed';
  const [posts, setPosts] = useState([]);
  const [caption, setCaption] = useState('');
  const [image, setImage] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageLoadErrors, setImageLoadErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const previewUrl = useMemo(() => {
    if (imagePreview) return imagePreview;
    return resolveImageUrl(image);
  }, [image, imagePreview]);

  const loadFeed = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await apiFetch('/feed');
      setPosts(data);
    } catch (err) {
      const message = err?.message || 'Failed to load feed';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  const createPost = async () => {
    if (!image && !imageFile && !caption) {
      notify({
        message: 'Please add an image file, image URL, or caption.',
        type: 'error',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const formData = new FormData();
      formData.append('caption', caption);

      if (imageFile) {
        formData.append('imageFile', imageFile);
      }

      if (image) {
        formData.append('image', image);
      }

      const data = await apiFetch('/feed', {
        method: 'POST',
        body: formData,
      });

      setPosts((prev) => [data, ...prev]);
      setCaption('');
      setImage('');
      setImageFile(null);
      setImageLoadErrors({});

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview('');
      }

      notify({ message: 'Travel update posted.', type: 'success' });
    } catch (err) {
      notify({ message: err?.message || 'Failed to post', type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className='fg-page min-h-screen px-4 py-12'>
      <div className='fg-orb fg-orb-1' aria-hidden='true' />
      <div className='fg-orb fg-orb-2' aria-hidden='true' />
      <div className='fg-page-content mx-auto w-full max-w-4xl fg-rise'>
        <div className='mb-8 flex flex-wrap items-start justify-between gap-4'>
          <SectionHeader
            kicker={featureName}
            title={featureName}
            subtitle='Share snapshots and tips from your travels.'
          />
          <BackButton />
        </div>

        <div className='fg-section mb-8'>
          <div className='grid gap-4 sm:grid-cols-3'>
            <div>
              <label className='fg-muted text-xs font-semibold'>Upload Image</label>
              <input
                type='file'
                accept='image/*'
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];

                  if (imagePreview) {
                    URL.revokeObjectURL(imagePreview);
                  }

                  setImageFile(file || null);
                  setImage(file ? '' : image);
                  setImagePreview(file ? URL.createObjectURL(file) : '');
                }}
                className='fg-input mt-2 text-sm'
              />
            </div>
            <div>
              <label className='fg-muted text-xs font-semibold'>Image URL</label>
              <input
                value={image}
                onChange={(e) => {
                  setImage(e.target.value);
                  if (imagePreview) {
                    URL.revokeObjectURL(imagePreview);
                    setImagePreview('');
                  }
                  if (imageFile) {
                    setImageFile(null);
                  }
                }}
                placeholder='https://...'
                className='fg-input mt-2 text-sm'
              />
            </div>
            <div>
              <label className='fg-muted text-xs font-semibold'>Caption</label>
              <input
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder='What did you discover?'
                className='fg-input mt-2 text-sm'
              />
            </div>
          </div>

          {previewUrl && (
            <div className='fg-card mt-4 overflow-hidden p-3'>
              <p className='fg-muted mb-3 text-xs font-semibold uppercase tracking-[0.22em]'>
                Preview
              </p>
              <img
                src={previewUrl}
                alt='Post preview'
                className='h-56 w-full rounded-2xl object-cover'
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_IMAGE;
                }}
              />
            </div>
          )}

          <button
            onClick={createPost}
            disabled={isSubmitting}
            className='fg-btn-primary mt-4 text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
          >
            {isSubmitting ? 'Posting...' : 'Post update'}
          </button>
        </div>

        {error && <div className='fg-alert mb-6 px-4 py-3 text-sm'>{error}</div>}

        {isLoading ? (
          <div className='space-y-4'>
            {[...Array(3)].map((_, index) => (
              <div key={`feed-loading-${index}`} className='fg-card p-6'>
                <div className='h-40 w-full rounded-xl bg-slate-800/70' />
                <div className='mt-4 h-4 w-3/4 rounded-full bg-slate-800/70' />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            title='No posts yet'
            description='Share the first travel update with your community.'
          />
        ) : (
          <div className='space-y-6'>
            {posts.map((post) => {
              const postImage = imageLoadErrors[post._id]
                ? FALLBACK_IMAGE
                : resolveImageUrl(post.image) || FALLBACK_IMAGE;

              return (
                <div key={post._id} className='fg-card overflow-hidden p-6'>
                  <img
                    src={postImage}
                    alt={post.caption || 'Travel update'}
                    className='h-64 w-full rounded-xl object-cover'
                    onError={() => {
                      setImageLoadErrors((prev) => ({ ...prev, [post._id]: true }));
                    }}
                  />
                  <div className='mt-4'>
                    <div className='flex flex-wrap items-center justify-between gap-3'>
                      <p className='fg-title text-sm font-semibold'>
                        {post.user?.name || 'Traveler'}
                      </p>
                      <span className='fg-chip text-[11px] font-semibold uppercase tracking-wide'>
                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>
                    <p className='fg-muted mt-2 text-sm'>
                      {post.caption || 'Shared a travel update.'}
                    </p>
                    {post.user?._id && String(post.user._id) === currentUserId && (
                      <button
                        type='button'
                        onClick={async () => {
                          if (!window.confirm('Delete this post?')) return;
                          try {
                            await apiFetch(`/feed/${post._id}`, { method: 'DELETE' });
                            setPosts((prev) => prev.filter((item) => item._id !== post._id));
                            notify({ message: 'Post deleted', type: 'success' });
                          } catch (err) {
                            notify({ message: err?.message || 'Delete failed', type: 'error' });
                          }
                        }}
                        className='fg-btn-secondary mt-4 text-xs'
                      >
                        Delete post
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Footer />
      </div>
    </div>
  );
}

export default Feed;
