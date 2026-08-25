import { useState } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { FlashcardTab } from '@/components/FlashcardTab';
import { AddWordTab } from '@/components/AddWordTab';
import { WordListTab } from '@/components/WordListTab';
import { StatsTab } from '@/components/StatsTab';
import { AuthScreen } from '@/components/AuthScreen';
import { CharacterNetworkTab } from '@/components/CharacterNetworkTab';
import { MemoryGameTab } from '@/components/MemoryGameTab';
import { useAuth } from '@/lib/useAuth';
import { useVocabStore } from '@/lib/useVocabStore';
import type { TabKey } from '@/lib/types';

function App() {
  const [tab, setTab] = useState<TabKey>('flashcard');
  const { user, loading: authLoading, signIn, signUp, signOut } = useAuth();
  const store = useVocabStore(user);



  const handleSignOut = async () => {
    await signOut();
    setTab('flashcard');
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
        streak={store.streak}
        totalWords={store.vocab.length}
        email={user.email}
        onSignOut={handleSignOut}
      />

      <main className="flex-1 p-2.5 sm:p-6 lg:p-8 min-w-0 overflow-y-auto max-w-7xl">
        {tab === 'flashcard' && (
          <FlashcardTab
            vocab={store.vocab}
            onSetMemoryBucket={store.setMemoryBucket}
            onRecordReview={store.recordReview}
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
        {tab === 'network' && (
          <CharacterNetworkTab vocab={store.vocab} />
        )}
        {tab === 'memory-game' && (
          <MemoryGameTab vocab={store.vocab} />
        )}
      </main>
    </div>
  );
}

export default App;
