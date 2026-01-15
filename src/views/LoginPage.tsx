import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Github, Chrome, Eye, EyeOff } from 'lucide-react';
import Pastraphic from '@/assets/Pastraphic.svg';
import backgroundRing from '@/assets/backgroundring.png';
import { useAuthStore } from '@/stores/auth-store';
import { useNotificationStore } from '@/stores/notification-store';
import { auth, db } from '@/lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, GithubAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';

const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isLoggedIn } = useAuthStore();
  const { success, error: showNotification } = useNotificationStore();
    const handleGithubLogin = async () => {
    setError('');
    setIsLoading(true);
    const provider = new GithubAuthProvider();
    try {
      console.log("[DEBUG_LOG] Starting GitHub Login...");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("[DEBUG_LOG] GitHub Login Success:", user.email);
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        console.log("[DEBUG_LOG] User does not exist, creating document...");
        try {
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: user.displayName || 'GitHub User',
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            status: 'active',
            plan: 'free'
          });
          console.log("[DEBUG_LOG] User document created successfully in 'users' collection");
          success('Welcome to OrbitalDisk!');
        } catch (fsError: any) {
          console.error("[DEBUG_LOG] CRITICAL: Failed to create user document in Firestore:", fsError);
          const errorMsg = `Auth successful, but failed to create user profile: ${fsError.message}`;
          setError(errorMsg);
          showNotification(errorMsg);
          setIsLoading(false);
          return;
        }
      } else {
        console.log("[DEBUG_LOG] User exists, updating lastLogin...");
        try {
          await setDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp(),
          }, { merge: true });
          console.log("[DEBUG_LOG] User lastLogin updated successfully");
          success('Logged in successfully');
        } catch (fsError: any) {
          console.error("[DEBUG_LOG] Failed to update lastLogin:", fsError);
        }
      }
      navigate('/pricing');
    } catch (err: any) {
      console.error('GitHub Login Error:', err);
          if (err.code === 'auth/popup-closed-by-user') {
            // Just stop loading, no need to show error
          } else if (err.code === 'auth/account-exists-with-different-credential') {
            setError('An account already exists with the same email address but using a different sign-in method. Please use the provider you originally signed up with, or link your accounts in your account settings.');
          } else if (err.code === 'auth/configuration-not-found') {
            setError('Firebase Auth configuration not found. Please ensure GitHub Sign-in is enabled in your Firebase Console and the Authorized Domains are set correctly.');
          } else if (err.code === 'auth/invalid-api-key') {
            setError('Firebase not configured correctly.');
          } else {
            setError(err.message || 'An error occurred during GitHub login');
          }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      navigate('/pricing');
    }
  }, [navigate, isLoggedIn]);

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      console.log("[DEBUG_LOG] Starting Google Login...");
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("[DEBUG_LOG] Google Login Success:", user.email);
      
      // Check if user exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (!userDoc.exists()) {
        console.log("[DEBUG_LOG] User does not exist, creating document...");
        try {
          // Create user record if it doesn't exist
          await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            name: user.displayName || 'Google User',
            email: user.email,
            photoURL: user.photoURL,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            status: 'active',
            plan: 'free' // Default plan
          });
          console.log("[DEBUG_LOG] User document created successfully in 'users' collection");
          success('Welcome to OrbitalDisk!');
        } catch (fsError: any) {
          console.error("[DEBUG_LOG] CRITICAL: Failed to create user document in Firestore:", fsError);
          const errorMsg = `Auth successful, but failed to create user profile: ${fsError.message}`;
          setError(errorMsg);
          showNotification(errorMsg);
          setIsLoading(false);
          return; // Stop here if we can't create the user profile
        }
      } else {
        console.log("[DEBUG_LOG] User exists, updating lastLogin...");
        try {
          // Update last login
          await setDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp(),
          }, { merge: true });
          console.log("[DEBUG_LOG] User lastLogin updated successfully");
          success('Logged in successfully');
        } catch (fsError: any) {
          console.error("[DEBUG_LOG] Failed to update lastLogin:", fsError);
          // We might choose to continue anyway if they already exist
        }
      }
      
      navigate('/pricing');
    } catch (err: any) {
      console.error('Google Login Error:', err);
          if (err.code === 'auth/popup-closed-by-user') {
            // Just stop loading, no need to show error
          } else if (err.code === 'auth/account-exists-with-different-credential') {
            setError('An account already exists with the same email address but using a different sign-in method. Please use the provider you originally signed up with, or link your accounts in your account settings.');
          } else if (err.code === 'auth/configuration-not-found') {
            setError('Firebase Auth configuration not found. Please ensure Google Sign-in is enabled in your Firebase Console and the Authorized Domains are set correctly.');
          } else if (err.code === 'auth/invalid-api-key') {
            setError('Firebase not configured correctly.');
          } else {
            setError(err.message || 'An error occurred during Google login');
          }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        // First try Firebase
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          console.log("[DEBUG_LOG] Firebase Email Login Success:", user.email);
          
          // Update last login in Firestore
          console.log("[DEBUG_LOG] Updating lastLogin in Firestore...");
          try {
            await setDoc(doc(db, 'users', user.uid), {
              lastLogin: serverTimestamp(),
            }, { merge: true });
            console.log("[DEBUG_LOG] Firestore update success");
            success('Logged in successfully');
          } catch (fsError: any) {
            console.error("[DEBUG_LOG] Firestore Login Update Error:", fsError);
            // Don't block login if just the lastLogin update fails, but log it
          }

          navigate('/pricing');
        } catch (fbError: any) {
          // Fallback to mock for now if it's the specific test account
          const validEmail = 'arche.winti@gmail.com';
          const validPassword = 'godisgreat';

          if (email === validEmail && password === validPassword) {
            login(email);
            success('Logged in with test account');
            navigate('/pricing');
          } else {
            console.error('Firebase Auth Error:', fbError);
            let errorMsg = fbError.message || 'Invalid email or password';
            if (fbError.code === 'auth/configuration-not-found') {
              errorMsg = 'Firebase Auth configuration not found. Please check your Firebase Console settings.';
            } else if (fbError.code === 'auth/invalid-api-key' || fbError.code === 'auth/network-request-failed') {
               errorMsg = 'Firebase not configured. Use test credentials.';
            }
            setError(errorMsg);
            showNotification(errorMsg);
          }
        }
      } else {
        // Sign Up with Firebase
        if (!email || !password || !name) {
          setError('Please fill in all fields');
          setIsLoading(false);
          return;
        }
        
        try {
          console.log("[DEBUG_LOG] Starting Firebase Email Signup for:", email);
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          console.log("[DEBUG_LOG] Firebase Signup Success:", user.uid);

          // Store user data in Firestore
          console.log("[DEBUG_LOG] Creating user document in Firestore...");
          try {
            await setDoc(doc(db, 'users', user.uid), {
              uid: user.uid,
              name: name,
              email: email,
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp(),
              status: 'active',
              plan: 'free' // Default plan
            });
            console.log("[DEBUG_LOG] User document created successfully");
            success('Account created successfully!');
          } catch (fsError: any) {
            console.error("[DEBUG_LOG] CRITICAL: Firestore Signup Error:", fsError);
            const errorMsg = `Account created, but database setup failed: ${fsError.message}`;
            setError(errorMsg);
            showNotification(errorMsg);
            setIsLoading(false);
            return;
          }

          navigate('/pricing');
        } catch (fbError: any) {
          console.error('Firebase Signup Error:', fbError);
          setError(fbError.message || 'Error creating account');
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0 opacity-20 dark:opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url(${backgroundRing})`,
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '150%',
        }}
      />
      
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 relative z-10">
        <div>
          <div className="flex justify-center">
            <img src={Pastraphic} alt="OrbitalDisk Logo" className="h-16 w-auto" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            {isLogin ? 'Sign in to your account' : 'Create your account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-blue-600 hover:text-blue-500 transition-colors"
            >
              {isLogin ? 'Sign Up' : 'sign in to your existing account'}
            </button>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {!isLogin && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="appearance-none relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Full Name"
                  disabled={isLoading}
                />
              </div>
            )}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                disabled={isLoading}
              />
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none relative block w-full px-10 py-3 border border-gray-300 dark:border-gray-600 placeholder-gray-500 text-gray-900 dark:text-white dark:bg-gray-700 rounded-xl focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded"
                disabled={isLoading}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-blue-600 hover:text-blue-500">
                Forgot your password?
              </a>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 dark:bg-red-900/20 py-2 rounded-lg border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                isLogin ? 'Sign in' : 'Create account'
              )}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center gap-4">
            <button
              type="button"
              onClick={handleGithubLogin}
              disabled={isLoading}
              className="inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              title="GitHub"
            >
              <Github className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="inline-flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
              title="Google"
            >
              <Chrome className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;