import { useMemo, useState } from 'react';
import { Header } from '@/components/Header';
import { NavTabs } from '@/components/NavTabs';
import { FlashcardTab } from '@/components/FlashcardTab';
import { ScheduleTab } from '@/components/ScheduleTab';
import { AddWordTab } from '@/components/AddWordTab';
import { WordListTab } from '@/components/WordListTab';
import { StatsTab } from '@/components/StatsTab';
import { AuthScreen } from '@/components/AuthScreen';
import { useAuth } from '@/lib/useAuth';
import { useVocabStore } from '@/lib/useVocabStore';
import { isDue } from '@/lib/srs';
import type { TabKey } from '@/lib/types';

function App() {
  const [tab, setTab] = useState<TabKey>('flashcard');
  const [filterDueOnly, setFilterDueOnly] = useState(false);
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const store = useVocabStore(user);

  const dueCount = useMemo(() => store.vocab.filter(isDue).length, [store.vocab]);

  const handleStartDue = () => {
    setFilterDueOnly(true);
    setTab('flashcard');
  };

  const handleClearDueFilter = () => setFilterDueOnly(false);

  const handleSignOut = async () => {
    await signOut();
    setTab('flashcard');
    setFilterDueOnly(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center animate-pulse">
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center animate-pulse">
            <span className="text-white text-xl font-bold">汉</span>
          </div>
          <p className="text-slate-400 text-sm">Đang tải từ vựng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        streak={store.streak}
        totalWords={store.vocab.length}
        email={user.email}
        onSignOut={handleSignOut}
      />
      <NavTabs active={tab} onChange={setTab} dueCount={dueCount} />

      <main className="pb-20">
        {tab === 'flashcard' && (
          <FlashcardTab
            vocab={store.vocab}
            onReview={store.reviewVocab}
            filterDueOnly={filterDueOnly}
            onClearDueFilter={handleClearDueFilter}
          />
        )}
        {tab === 'schedule' && (
          <ScheduleTab vocab={store.vocab} onStartDue={handleStartDue} />
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
