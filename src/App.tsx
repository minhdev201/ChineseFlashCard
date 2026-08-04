import { useMemo, useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { FlashcardTab } from '@/components/FlashcardTab';
import { MemoryBucketTab } from '@/components/MemoryBucketTab';
import { AddWordTab } from '@/components/AddWordTab';
import { WordListTab } from '@/components/WordListTab';
import { StatsTab } from '@/components/StatsTab';
import { AuthScreen } from '@/components/AuthScreen';
import { useAuth } from '@/lib/useAuth';
import { useVocabStore } from '@/lib/useVocabStore';
import type { FlashcardSource, MemoryBucket, TabKey } from '@/lib/types';

function App() {
  const [tab, setTab] = useState<TabKey>('flashcard');
  const [flashcardSource, setFlashcardSource] = useState<FlashcardSource>('all');
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const store = useVocabStore(user);

  const unrememberedCount = useMemo(
    () => store.vocab.filter((item) => item.memory_bucket === 'unremembered').length,
    [store.vocab]
  );
  const temporaryCount = useMemo(
    () => store.vocab.filter((item) => item.memory_bucket === 'temporary').length,
    [store.vocab]
  );

  const handleStartFocusedReview = (bucket: MemoryBucket) => {
    setFlashcardSource(bucket);
    setTab('flashcard');
  };

  const handleShowAllFlashcards = () => setFlashcardSource('all');

  const handleSignOut = async () => {
    await signOut();
    setTab('flashcard');
    setFlashcardSource('all');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center animate-pulse shadow-lg">
            <span className="text-white text-xl font-bold">汉</span>
          </div>
          <p className="text-slate-400 text-sm">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSignIn={signIn} onSignUp={signUp} />;
  }

  if (store.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center animate-pulse shadow-lg">
            <span className="text-white text-xl font-bold">汉</span>
          </div>
          <p className="text-slate-400 text-sm">Đang tải từ vựng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <Sidebar
        active={tab}
        onChange={setTab}
        unrememberedCount={unrememberedCount}
        temporaryCount={temporaryCount}
        streak={store.streak}
        totalWords={store.vocab.length}
        email={user.email}
        onSignOut={handleSignOut}
        activeSource={flashcardSource}
        onShowAllFlashcards={handleShowAllFlashcards}
      />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto max-w-7xl">
        {tab === 'flashcard' && (
          <FlashcardTab
            vocab={store.vocab}
            activeSource={flashcardSource}
            onSetMemoryBucket={store.setMemoryBucket}
            onShowAllFlashcards={handleShowAllFlashcards}
            onRecordReview={store.recordReview}
          />
        )}
        {tab === 'unremembered' && (
          <MemoryBucketTab
            bucket="unremembered"
            vocab={store.vocab}
            onMove={store.setMemoryBucket}
            onStartFocusReview={handleStartFocusedReview}
          />
        )}
        {tab === 'temporary' && (
          <MemoryBucketTab
            bucket="temporary"
            vocab={store.vocab}
            onMove={store.setMemoryBucket}
            onStartFocusReview={handleStartFocusedReview}
          />
        )}
        {tab === 'add' && (
          <AddWordTab onAdd={store.addVocab} isDuplicate={store.findDuplicate} />
        )}
        {tab === 'list' && (
          <WordListTab
            vocab={store.vocab}
            onUpdate={store.updateVocab}
            onDelete={store.deleteVocab}
          />
        )}
        {tab === 'stats' && (
          <StatsTab
            vocab={store.vocab}
            streak={store.streak}
            totalReviews={store.totalReviews}
            activity={store.activity}
          />
        )}
      </main>
    </div>
  );
}

export default App;
