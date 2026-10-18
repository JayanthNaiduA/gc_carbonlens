import React, { useState, useEffect } from 'react';
import { User, ConsentPreferences } from './types';
import { AuthScreen } from './features/auth/AuthScreen';
import { ConsentScreen } from './features/consent/ConsentScreen';
import { DashboardLayout } from './features/dashboard/DashboardLayout';
import { CartProvider } from './features/cart/CartContext';
import { CurrencyProvider } from './utils/currency';
import { auth, getUserProfile, saveUserProfile } from './services/firebase';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';

export const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [consent, setConsent] = useState<ConsentPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Listen to live Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Authenticated via Firebase
        try {
          const profile = await getUserProfile(fbUser.uid);
          const appUser: User = {
            uid: fbUser.uid,
            displayName: profile?.displayName || fbUser.email?.split('@')[0] || fbUser.phoneNumber || 'Eco User',
            email: fbUser.email,
            phoneNumber: fbUser.phoneNumber,
            emailVerified: fbUser.emailVerified,
            isDemo: false,
          };
          setUser(appUser);

          // Restore consent if previously recorded in profile
          if (profile?.consent) {
            setConsent(profile.consent);
          } else {
            // New Firebase user needs to confirm consent preferences
            setConsent(null);
          }
        } catch (err) {
          console.error('Error fetching Firestore user profile:', err);
          setUser({
            uid: fbUser.uid,
            displayName: fbUser.email?.split('@')[0] || fbUser.phoneNumber || 'Eco User',
            email: fbUser.email,
            phoneNumber: fbUser.phoneNumber,
            emailVerified: fbUser.emailVerified,
            isDemo: false,
          });
        }
      } else {
        // Not signed in to Firebase: check if running local demo
        setUser((prev) => (prev?.isDemo ? prev : null));
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      if (!user?.isDemo) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.error('Error signing out:', err);
    }
    setUser(null);
    setConsent(null);
  };

  const handleConsentAccepted = async (acceptedConsent: ConsentPreferences) => {
    setConsent(acceptedConsent);
    // Persist to Firestore if real Firebase user
    if (user && !user.isDemo) {
      try {
        await saveUserProfile({
          uid: user.uid,
          displayName: user.displayName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          consent: acceptedConsent,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to persist consent to Firestore:', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fbfa] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-[#008b5b] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-[#008b5b]">Connecting to CarbonLens…</p>
        </div>
      </div>
    );
  }

  // 1. If not authenticated, render AuthScreen
  if (!user) {
    return (
      <AuthScreen
        onSignIn={(newUser) => {
          setUser(newUser);
          if (newUser.isDemo) {
            // Default demo consent
            setConsent({
              camera: true,
              location: true,
              healthConnect: true,
              microphone: false,
              personalization: true,
              acceptedAt: new Date().toISOString(),
            });
          } else {
            setConsent(null);
          }
        }}
      />
    );
  }

  // 2. If consent not yet answered, render ConsentScreen
  if (!consent) {
    return (
      <ConsentScreen
        initialConsent={{
          camera: false,
          location: false,
          healthConnect: false,
          microphone: false,
          personalization: false,
        }}
        onConsentAccepted={handleConsentAccepted}
        onSignOut={handleSignOut}
      />
    );
  }

  // 3. Authenticated and consented -> render full CarbonLens Dashboard
  return (
    <CurrencyProvider>
      <CartProvider currentUser={user}>
        <DashboardLayout
          user={user}
          consent={consent}
          onUpdateConsent={handleConsentAccepted}
          onSignOut={handleSignOut}
        />
      </CartProvider>
    </CurrencyProvider>
  );
};

export default App;
