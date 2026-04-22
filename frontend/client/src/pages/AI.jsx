import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import BackButton from '../components/BackButton';
import Footer from '../components/Footer';
import Navbar from '../components/Navbar';
import { apiFetch } from '../services/apiFetch';

function AI() {
  const [searchParams] = useSearchParams();
  const requestedFeature = searchParams.get('feature') || 'TravelGPT Assistant';
  const [destination, setDestination] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      content:
        'Hi, I am TravelGPT. Ask me anything about planning trips, visas, budgets, itineraries, and packing.',
    },
  ]);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const chatContainerRef = useRef(null);

  const mode = useMemo(() => {
    const feature = requestedFeature.toLowerCase();

    if (feature.includes('luggage')) {
      return 'luggage';
    }

    if (feature.includes('trip-plan') || feature.includes('trip plan') || feature.includes('planner')) {
      return 'trip-plan';
    }

    return 'chat';
  }, [requestedFeature]);

  const title =
    mode === 'luggage'
      ? 'AI Luggage Manager'
      : mode === 'trip-plan'
        ? 'AI Trip Planner'
        : 'TravelGPT Chat';
  const buttonText =
    mode === 'luggage' ? 'Generate checklist' : mode === 'trip-plan' ? 'Generate plan' : 'Send';
  const promptIdeas =
    mode === 'luggage'
      ? ['Goa', 'Manali', 'Shimla', 'Kerala']
      : mode === 'trip-plan'
        ? ['Tokyo', 'Barcelona', 'Bali', 'New York']
        : [
          'Plan a 3-day Goa trip under 20k INR',
          'Best places in Himachal for April',
          'What to pack for Thailand in monsoon',
          'Budget itinerary for Jaipur and Udaipur',
        ];

  const scrollChatToBottom = () => {
    if (!chatContainerRef.current) {
      return;
    }

    chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (mode === 'chat') {
      const userMessage = chatInput.trim();

      if (!userMessage || chatLoading) {
        return;
      }

      const nextMessages = [...chatMessages, { role: 'user', content: userMessage }];

      setChatMessages(nextMessages);
      setChatInput('');
      setError('');
      setChatLoading(true);

      setTimeout(scrollChatToBottom, 0);

      try {
        const data = await apiFetch('/ai/chat', {
          method: 'POST',
          body: JSON.stringify({ messages: nextMessages }),
        });

        setChatMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } catch (err) {
        setError(err?.message || 'Failed to fetch AI response');
      } finally {
        setChatLoading(false);
        setTimeout(scrollChatToBottom, 0);
      }

      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await apiFetch(`/ai/${mode}`, {
        method: 'POST',
        body: JSON.stringify({ destination }),
      });
      setResult(data);
    } catch (err) {
      setError(err?.message || 'Failed to fetch AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fg-page min-h-screen'>
      <div className='fg-orb fg-orb-1' aria-hidden='true' />
      <div className='fg-orb fg-orb-2' aria-hidden='true' />
      <div className='fg-orb fg-orb-3' aria-hidden='true' />
      <div className='fg-page-content'>
        <Navbar />
        <main className='mx-auto max-w-5xl px-4 pb-20 pt-10 sm:px-6 lg:px-8'>
          <div className='mb-6 flex justify-end'>
            <BackButton />
          </div>

          <section className='fg-section fg-rise'>
            <p className='fg-kicker text-xs font-semibold uppercase'>AI tools</p>
            <h1 className='fg-title mt-4 text-4xl font-black leading-tight sm:text-6xl'>{title}</h1>
            <p className='fg-muted mt-5 max-w-3xl text-base sm:text-lg'>
              {mode === 'luggage'
                ? 'Get a quick, destination-based packing checklist so you forget less and travel lighter.'
                : mode === 'trip-plan'
                  ? 'Enter a destination to get a simple multi-day outline you can refine with your group.'
                  : 'Chat with TravelGPT in real time to plan destinations, costs, routes, and practical travel decisions.'}
            </p>

            <div className='mt-4 flex flex-wrap gap-2 text-xs'>
              <a href='/ai?feature=TravelGPT%20Assistant' className='fg-chip'>
                Chat
              </a>
              <a href='/ai?feature=luggage' className='fg-chip'>
                Luggage
              </a>
              <a href='/ai?feature=trip-plan' className='fg-chip'>
                Trip plan
              </a>
            </div>

            {mode === 'chat' ? (
              <>
                <div
                  ref={chatContainerRef}
                  className='fg-card mt-8 h-[420px] overflow-y-auto p-4 sm:p-6'
                >
                  <div className='space-y-4'>
                    {chatMessages.map((message, index) => {
                      const isUser = message.role === 'user';

                      return (
                        <div
                          key={`${message.role}-${index}`}
                          className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 ${
                              isUser
                                ? 'bg-sky-400/20 border border-sky-300/25 text-sky-100'
                                : 'bg-slate-800/75 border border-slate-500/25 fg-muted'
                            }`}
                          >
                            <p className='mb-1 text-[11px] font-semibold uppercase tracking-[0.2em]'>
                              {isUser ? 'You' : 'TravelGPT'}
                            </p>
                            <p className='whitespace-pre-wrap'>{message.content}</p>
                          </div>
                        </div>
                      );
                    })}

                    {chatLoading && (
                      <div className='flex justify-start'>
                        <div className='max-w-[85%] rounded-2xl border border-slate-500/25 bg-slate-800/75 px-4 py-3 text-sm fg-muted'>
                          TravelGPT is thinking...
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className='mt-4 grid gap-4 sm:grid-cols-[1fr_auto]'>
                  <input
                    type='text'
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    placeholder='Ask anything about your trip'
                    className='fg-input'
                  />
                  <button
                    type='submit'
                    disabled={chatLoading || !chatInput.trim()}
                    className='fg-btn-primary text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
                  >
                    {chatLoading ? 'Sending...' : buttonText}
                  </button>
                </form>
              </>
            ) : (
              <form onSubmit={handleSubmit} className='mt-8 grid gap-4 sm:grid-cols-[1fr_auto]'>
                <input
                  type='text'
                  value={destination}
                  onChange={(event) => setDestination(event.target.value)}
                  placeholder={
                    mode === 'trip-plan' ? 'Enter destination for trip plan' : 'Enter destination for packing list'
                  }
                  className='fg-input'
                />
                <button
                  type='submit'
                  disabled={loading || !destination.trim()}
                  className='fg-btn-primary text-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70'
                >
                  {loading ? 'Loading...' : buttonText}
                </button>
              </form>
            )}

            <div className='mt-5 flex flex-wrap gap-3'>
              {promptIdeas.map((idea) => (
                <button
                  key={idea}
                  type='button'
                  className='fg-btn-secondary text-xs'
                  onClick={() => {
                    if (mode === 'chat') {
                      setChatInput(idea);
                    } else {
                      setDestination(idea);
                    }
                  }}
                >
                  {idea}
                </button>
              ))}
            </div>

            {error && <div className='fg-alert mt-6 px-4 py-3 text-sm'>{error}</div>}

            {result && (mode === 'luggage' || mode === 'trip-plan') && (
              <div className='fg-card mt-6 p-6'>
                {result.destination && (
                  <p className='fg-muted text-sm'>Destination: {result.destination}</p>
                )}

                {typeof result.days === 'number' && (
                  <div className='mt-4 inline-block rounded-full border border-[var(--fg-border)] px-4 py-2 text-xs font-semibold uppercase tracking-wide'>
                    {result.days} day plan
                  </div>
                )}

                {Array.isArray(result.activities) && (
                  <div className='mt-5'>
                    <h2 className='fg-title text-xl font-bold'>Suggested plan</h2>
                    <ul className='fg-muted mt-3 space-y-3 text-sm'>
                      {result.activities.map((item, index) => (
                        <li key={`${item}-${index}`}>
                          <span className='fg-title font-semibold'>Day {index + 1}:</span> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {Array.isArray(result.items) && (
                  <div className='mt-5'>
                    <h2 className='fg-title text-xl font-bold'>Packing checklist</h2>
                    <ul className='fg-muted mt-3 grid gap-3 sm:grid-cols-2 text-sm'>
                      {result.items.map((item, index) => (
                        <li key={`${item}-${index}`} className='fg-card px-4 py-3'>
                          • {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className='fg-section mt-10 fg-rise'>
            <h2 className='fg-title text-3xl font-black sm:text-4xl'>What this tool helps with</h2>
            <div className='mt-6 grid gap-4 md:grid-cols-3'>
              <article className='fg-card p-5'>
                <h3 className='fg-title text-base font-bold'>Quick planning</h3>
                <p className='fg-muted mt-2 text-sm'>
                  Generate a simple trip outline without spending time researching from scratch.
                </p>
              </article>
              <article className='fg-card p-5'>
                <h3 className='fg-title text-base font-bold'>Smarter packing</h3>
                <p className='fg-muted mt-2 text-sm'>
                  Get an instant checklist for essentials before you leave.
                </p>
              </article>
              <article className='fg-card p-5'>
                <h3 className='fg-title text-base font-bold'>Better decisions</h3>
                <p className='fg-muted mt-2 text-sm'>
                  Use AI support to move faster from destination idea to actual trip plan.
                </p>
              </article>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}

export default AI;
