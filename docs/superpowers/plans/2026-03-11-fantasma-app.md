# Fantasma App Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a React Native / Expo mobile app for Fantasma Football players with Home/Schedule and AI Drill Coach screens.

**Architecture:** Separate `fantasma-app` repo using Expo Router (file-based navigation), Supabase for auth + database, calling existing Vercel API endpoints at fantasmafootball.com for booking and drills.

**Tech Stack:** Expo SDK 53, Expo Router, Supabase JS, TypeScript, React Context

**Spec:** `docs/superpowers/specs/2026-03-11-fantasma-app-design.md`

---

## Chunk 1: Project Scaffold + Supabase + Auth

### Task 1: Create Expo project and install dependencies

**Files:**
- Create: `fantasma-app/` (new repo, sibling to `fantasma-site`)

- [ ] **Step 1: Create Expo project**

```bash
cd C:\Users\conhu
npx create-expo-app@latest fantasma-app --template blank-typescript
cd fantasma-app
```

- [ ] **Step 2: Install dependencies**

```bash
npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-screens react-native-safe-area-context react-native-gesture-handler react-native-reanimated
npx expo install @supabase/supabase-js expo-secure-store @react-native-async-storage/async-storage
npx expo install expo-font @expo-google-fonts/bebas-neue @expo-google-fonts/outfit
```

- [ ] **Step 3: Configure app.json for Expo Router**

Update `app.json`:
```json
{
  "expo": {
    "name": "Fantasma Football",
    "slug": "fantasma-app",
    "scheme": "fantasma",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "backgroundColor": "#040C14"
    },
    "plugins": ["expo-router", "expo-secure-store"],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

- [ ] **Step 4: Set up package.json main entry**

Add to `package.json`:
```json
{
  "main": "expo-router/entry"
}
```

- [ ] **Step 5: Init git and commit**

```bash
cd C:\Users\conhu\fantasma-app
git init
git add -A
git commit -m "chore: scaffold Expo project with dependencies"
```

---

### Task 2: Brand constants and types

**Files:**
- Create: `lib/constants.ts`
- Create: `lib/types.ts`

- [ ] **Step 1: Create lib/constants.ts**

```typescript
export const Colors = {
  darkNavy: '#040C14',
  vegasGold: '#C5B358',
  lightCream: '#F8F7F4',
  black: '#0A0A0A',
  white: '#FFFFFF',
  goldMuted: 'rgba(197,179,88,0.5)',
  goldSubtle: 'rgba(197,179,88,0.12)',
  goldBorder: 'rgba(197,179,88,0.2)',
  whiteSubtle: 'rgba(255,255,255,0.03)',
  whiteMuted: 'rgba(255,255,255,0.4)',
  whiteBorder: 'rgba(255,255,255,0.06)',
} as const;

export const Fonts = {
  display: 'BebasNeue_400Regular',
  body: 'Outfit_400Regular',
  bodyMedium: 'Outfit_500Medium',
  bodySemiBold: 'Outfit_600SemiBold',
  bodyBold: 'Outfit_700Bold',
} as const;

export const API_BASE = 'https://fantasmafootball.com/api';
```

- [ ] **Step 2: Create lib/types.ts**

```typescript
export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  session_type: '1-on-1' | 'small-group';
  date: string;
  time: string;
  duration_min: number;
  calendar_event_id: string | null;
  created_at: string;
}

export interface SavedDrill {
  id: string;
  user_id: string;
  name: string;
  description: string;
  steps: string[];
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
  equipment: string;
  focus_areas: string[];
  created_at: string;
}

export interface CuratedDrill {
  id: string;
  name: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: string;
  equipment: string;
  category: string;
  steps: string[];
}

export interface ActivityLog {
  id: string;
  user_id: string;
  date: string;
  duration_min: number;
  notes: string | null;
  created_at: string;
}

```

- [ ] **Step 3: Commit**

```bash
git add lib/
git commit -m "feat: add brand constants and TypeScript types"
```

---

### Task 3: Supabase client setup

**Files:**
- Create: `lib/supabase.ts`
- Create: `.env.local` (gitignored)
- Modify: `.gitignore`

- [ ] **Step 1: Add .env.local to .gitignore**

Append to `.gitignore`:
```
.env.local
```

- [ ] **Step 2: Create .env.local**

```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

(Replace with actual values from Supabase dashboard after creating the project)

- [ ] **Step 3: Create lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const ExpoSecureStoreAdapter = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase.ts .gitignore
git commit -m "feat: configure Supabase client with SecureStore"
```

---

### Task 4: Supabase database setup (SQL migrations)

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Create migration file**

```sql
-- profiles: extends Supabase auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, first_name, last_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name', ''),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- saved_drills
create table public.saved_drills (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  description text not null,
  steps jsonb not null,
  duration text not null,
  intensity text not null,
  equipment text not null,
  focus_areas text[] not null,
  created_at timestamptz default now()
);

alter table public.saved_drills enable row level security;

create policy "Users can view own drills"
  on public.saved_drills for select
  using (auth.uid() = user_id);

create policy "Users can insert own drills"
  on public.saved_drills for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own drills"
  on public.saved_drills for delete
  using (auth.uid() = user_id);

-- activity_log
create table public.activity_log (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  date date not null default current_date,
  duration_min int default 60,
  notes text,
  created_at timestamptz default now()
);

alter table public.activity_log enable row level security;

create policy "Users can view own activity"
  on public.activity_log for select
  using (auth.uid() = user_id);

create policy "Users can insert own activity"
  on public.activity_log for insert
  with check (auth.uid() = user_id);

-- bookings (local cache)
create table public.bookings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  session_type text not null,
  date date not null,
  time text not null,
  duration_min int not null,
  calendar_event_id text,
  created_at timestamptz default now()
);

alter table public.bookings enable row level security;

create policy "Users can view own bookings"
  on public.bookings for select
  using (auth.uid() = user_id);

create policy "Users can insert own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);
```

- [ ] **Step 2: Run migration in Supabase dashboard**

Go to Supabase dashboard → SQL Editor → paste and run the migration. Alternatively, if using Supabase CLI:

```bash
npx supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/
git commit -m "feat: add Supabase schema with RLS policies"
```

---

### Task 5: Auth context provider

**Files:**
- Create: `contexts/AuthContext.tsx`

- [ ] **Step 1: Create AuthContext.tsx**

```typescript
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile } from '../lib/types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    setProfile(data);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (session?.user) await fetchProfile(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

- [ ] **Step 2: Commit**

```bash
git add contexts/
git commit -m "feat: add AuthContext with Supabase auth"
```

---

### Task 6: Root layout + auth routing

**Files:**
- Create: `app/_layout.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/sign-in.tsx`
- Create: `app/(auth)/sign-up.tsx`
- Create: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Create root layout**

`app/_layout.tsx`:
```typescript
import { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts, BebasNeue_400Regular } from '@expo-google-fonts/bebas-neue';
import { Outfit_400Regular, Outfit_500Medium, Outfit_600SemiBold, Outfit_700Bold } from '@expo-google-fonts/outfit';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../lib/constants';

function RootNavigator() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.darkNavy }}>
        <ActivityIndicator size="large" color={Colors.vegasGold} />
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    BebasNeue_400Regular,
    Outfit_400Regular,
    Outfit_500Medium,
    Outfit_600SemiBold,
    Outfit_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.darkNavy }}>
        <ActivityIndicator size="large" color={Colors.vegasGold} />
      </View>
    );
  }

  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
    </AuthProvider>
  );
}
```

- [ ] **Step 2: Create auth group layout**

`app/(auth)/_layout.tsx`:
```typescript
import { Stack } from 'expo-router';
import { Colors } from '../../lib/constants';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.darkNavy },
      }}
    />
  );
}
```

- [ ] **Step 3: Create sign-in screen**

`app/(auth)/sign-in.tsx`:
```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Fonts } from '../../lib/constants';

export default function SignIn() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email, password);
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.inner}>
        <Text style={styles.title}>FANTASMA</Text>
        <Text style={styles.subtitle}>Fear the Phantom. Train Fantasma.</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.whiteMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.whiteMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'SIGNING IN...' : 'SIGN IN'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/sign-up" style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkBold}>Sign up</Text></Text>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkNavy },
  inner: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontFamily: Fonts.display, fontSize: 48, color: Colors.white, textAlign: 'center', letterSpacing: 4 },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.goldMuted, textAlign: 'center', letterSpacing: 2, marginBottom: 40 },
  error: { fontFamily: Fonts.body, fontSize: 13, color: '#FF6B6B', textAlign: 'center', marginBottom: 16 },
  input: {
    fontFamily: Fonts.body, fontSize: 16, color: Colors.white,
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.vegasGold, borderRadius: 14, padding: 16, marginTop: 8,
  },
  buttonText: {
    fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.darkNavy,
    textAlign: 'center', letterSpacing: 2,
  },
  link: { marginTop: 24, alignSelf: 'center' },
  linkText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.whiteMuted },
  linkBold: { color: Colors.vegasGold },
});
```

- [ ] **Step 4: Create sign-up screen**

`app/(auth)/sign-up.tsx`:
```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { Colors, Fonts } from '../../lib/constants';

export default function SignUp() {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await signUp(email, password, firstName, lastName);
    if (err) setError(err.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>JOIN FANTASMA</Text>
        <Text style={styles.subtitle}>Create your training account</Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor={Colors.whiteMuted}
          value={firstName}
          onChangeText={setFirstName}
        />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor={Colors.whiteMuted}
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={Colors.whiteMuted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={Colors.whiteMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/sign-in" style={styles.link}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Sign in</Text></Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkNavy },
  inner: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  title: { fontFamily: Fonts.display, fontSize: 48, color: Colors.white, textAlign: 'center', letterSpacing: 4 },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.goldMuted, textAlign: 'center', letterSpacing: 2, marginBottom: 40 },
  error: { fontFamily: Fonts.body, fontSize: 13, color: '#FF6B6B', textAlign: 'center', marginBottom: 16 },
  input: {
    fontFamily: Fonts.body, fontSize: 16, color: Colors.white,
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
    borderRadius: 14, padding: 16, marginBottom: 12,
  },
  button: {
    backgroundColor: Colors.vegasGold, borderRadius: 14, padding: 16, marginTop: 8,
  },
  buttonText: {
    fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.darkNavy,
    textAlign: 'center', letterSpacing: 2,
  },
  link: { marginTop: 24, alignSelf: 'center' },
  linkText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.whiteMuted },
  linkBold: { color: Colors.vegasGold },
});
```

- [ ] **Step 5: Create tabs layout**

`app/(tabs)/_layout.tsx`:
```typescript
import { Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors, Fonts } from '../../lib/constants';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.darkNavy,
          borderTopColor: Colors.whiteBorder,
          height: 84,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.vegasGold,
        tabBarInactiveTintColor: Colors.whiteMuted,
        tabBarLabelStyle: {
          fontFamily: Fonts.bodyMedium,
          fontSize: 10,
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>&#9776;</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="drills"
        options={{
          title: 'Drills',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>&#9889;</Text>
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 6: Create placeholder Home screen**

`app/(tabs)/index.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const { profile } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Good morning,</Text>
      <Text style={styles.name}>{profile?.first_name?.toUpperCase() || 'PLAYER'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkNavy, padding: 20, paddingTop: 60 },
  greeting: { fontFamily: Fonts.body, fontSize: 14, color: Colors.whiteMuted },
  name: { fontFamily: Fonts.display, fontSize: 32, color: Colors.white, letterSpacing: 2 },
});
```

- [ ] **Step 7: Create placeholder Drills screen**

`app/(tabs)/drills/index.tsx`:
```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../../../lib/constants';

export default function DrillsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>AI DRILL COACH</Text>
      <Text style={styles.subtitle}>Train smarter. Train Fantasma.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.darkNavy, padding: 20, paddingTop: 60 },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.white, letterSpacing: 2 },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.whiteMuted, marginTop: 4 },
});
```

- [ ] **Step 8: Create drills stack layout**

`app/(tabs)/drills/_layout.tsx`:
```typescript
import { Stack } from 'expo-router';
import { Colors } from '../../../lib/constants';

export default function DrillsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.darkNavy },
      }}
    />
  );
}
```

- [ ] **Step 9: Run the app to verify scaffold works**

```bash
npx expo start
```

Expected: App launches, shows sign-in screen. After sign-up/sign-in, shows Home tab with greeting and Drills tab with placeholder.

- [ ] **Step 10: Commit**

```bash
git add app/ contexts/
git commit -m "feat: add auth flow, tab navigation, placeholder screens"
```

---

## Chunk 2: API Layer + Vercel Changes

### Task 7: API client for Vercel endpoints

**Files:**
- Create: `lib/api.ts`

- [ ] **Step 1: Create lib/api.ts**

```typescript
import { API_BASE } from './constants';
import { CuratedDrill } from './types';

interface AvailabilityResponse {
  date: string;
  sessionType: string;
  slots: string[]; // 24h format time strings, e.g. "15:00"
}

interface BookingResponse {
  success: boolean;
  booking: {
    sessionType: string;
    date: string;
    time: string;
    duration: string; // "1 hour" or "1.5 hours"
    calendarEventId?: string;
  };
}

interface DrillsResponse {
  drills: CuratedDrill[];
  featured: CuratedDrill;
}

export interface GeneratedDrill {
  name: string;
  description: string;
  steps: string[];
  duration: string;
  intensity: 'Low' | 'Medium' | 'High';
  equipment: string;
}

export async function getAvailability(date: string, sessionType: string = '1-on-1'): Promise<AvailabilityResponse> {
  const res = await fetch(`${API_BASE}/availability?date=${date}&sessionType=${sessionType}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to fetch availability');
  }
  return res.json();
}

export async function bookSession(data: {
  name: string;
  email: string;
  phone: string;
  sessionType: string;
  date: string;
  time: string;
}): Promise<BookingResponse> {
  const res = await fetch(`${API_BASE}/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || 'Failed to book session');
  }
  return res.json();
}

export async function getDrills(category?: string): Promise<DrillsResponse> {
  const params = category && category !== 'All' ? `?category=${category}` : '';
  const res = await fetch(`${API_BASE}/drills${params}`);
  if (!res.ok) throw new Error('Failed to fetch drills');
  return res.json();
}

export async function generateDrill(focusAreas: string[], difficulty?: string): Promise<GeneratedDrill> {
  const res = await fetch(`${API_BASE}/generate-drill`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ focusAreas, difficulty }),
  });
  if (!res.ok) throw new Error('Failed to generate drill');
  return res.json();
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/api.ts
git commit -m "feat: add API client for Vercel endpoints"
```

---

### Task 8: Modify api/book.js to return calendar event ID

**Repo:** `fantasma-site` (not `fantasma-app`)

**Files:**
- Modify: `C:\Users\conhu\fantasma-site\api\book.js:179`

- [ ] **Step 1: Update calendar insert to capture event ID**

In `api/book.js`, change line 179:

```javascript
// Before:
await calendar.events.insert({

// After:
const event = await calendar.events.insert({
```

- [ ] **Step 2: Add calendarEventId to response**

In `api/book.js`, change lines 240-248:

```javascript
// Before:
    return res.status(200).json({
      success: true,
      booking: {
        sessionType: SESSION_LABELS[sessionType],
        date: formatDatePretty(date),
        time: formatTime12(time),
        duration: duration === 60 ? '1 hour' : '1.5 hours',
      },
    })

// After:
    return res.status(200).json({
      success: true,
      booking: {
        sessionType: SESSION_LABELS[sessionType],
        date: formatDatePretty(date),
        time: formatTime12(time),
        duration: duration === 60 ? '1 hour' : '1.5 hours',
        calendarEventId: event.data.id,
      },
    })
```

- [ ] **Step 3: Commit in fantasma-site**

```bash
cd C:\Users\conhu\fantasma-site
git add api/book.js
git commit -m "feat: return Google Calendar event ID from booking response"
```

---

## Chunk 3: Home Screen Features

### Task 9: Supabase data helpers

**Files:**
- Create: `lib/database.ts`

- [ ] **Step 1: Create lib/database.ts**

```typescript
import { supabase } from './supabase';
import { Booking, SavedDrill, ActivityLog, Profile } from './types';

// --- Profile ---
export async function updateProfile(userId: string, updates: Partial<Pick<Profile, 'first_name' | 'last_name' | 'phone'>>) {
  const { error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
  if (error) throw error;
}

// --- Bookings ---
export async function getUpcomingBookings(userId: string): Promise<Booking[]> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('user_id', userId)
    .gte('date', today)
    .order('date', { ascending: true })
    .order('time', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function insertBooking(booking: Omit<Booking, 'id' | 'created_at'>): Promise<Booking> {
  const { data, error } = await supabase
    .from('bookings')
    .insert(booking)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Saved Drills ---
export async function getSavedDrills(userId: string): Promise<SavedDrill[]> {
  const { data, error } = await supabase
    .from('saved_drills')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function insertSavedDrill(drill: Omit<SavedDrill, 'id' | 'created_at'>): Promise<SavedDrill> {
  const { data, error } = await supabase
    .from('saved_drills')
    .insert(drill)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSavedDrill(drillId: string): Promise<void> {
  const { error } = await supabase
    .from('saved_drills')
    .delete()
    .eq('id', drillId);
  if (error) throw error;
}

// --- Activity Log ---
export async function logActivity(entry: Omit<ActivityLog, 'id' | 'created_at'>): Promise<ActivityLog> {
  const { data, error } = await supabase
    .from('activity_log')
    .insert(entry)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getActivityStats(userId: string): Promise<{ sessions: number; hours: number; streak: number }> {
  const { data, error } = await supabase
    .from('activity_log')
    .select('date, duration_min')
    .eq('user_id', userId)
    .order('date', { ascending: false });
  if (error) throw error;

  const entries = data ?? [];
  const sessions = entries.length;
  const hours = Math.round(entries.reduce((sum, e) => sum + (e.duration_min || 60), 0) / 60);

  // Streak: consecutive weeks with at least one entry
  let streak = 0;
  if (entries.length > 0) {
    const now = new Date();
    const getWeekNum = (d: Date) => {
      const start = new Date(d.getFullYear(), 0, 1);
      return Math.floor((d.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000));
    };

    const weeks = new Set(entries.map(e => {
      const d = new Date(e.date);
      return `${d.getFullYear()}-${getWeekNum(d)}`;
    }));

    let checkWeek = getWeekNum(now);
    let checkYear = now.getFullYear();

    while (weeks.has(`${checkYear}-${checkWeek}`)) {
      streak++;
      checkWeek--;
      if (checkWeek < 0) {
        checkYear--;
        checkWeek = 52;
      }
    }
  }

  return { sessions, hours, streak };
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/database.ts
git commit -m "feat: add Supabase database helpers"
```

---

### Task 10: Shared UI components

**Files:**
- Create: `components/SessionCard.tsx`
- Create: `components/StatCard.tsx`
- Create: `components/DrillCard.tsx`

- [ ] **Step 1: Create SessionCard.tsx**

```typescript
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts } from '../lib/constants';
import { Booking } from '../lib/types';

interface Props {
  booking: Booking | null;
  onPress: () => void;
}

export function SessionCard({ booking, onPress }: Props) {
  if (!booking) {
    return (
      <TouchableOpacity style={styles.card} onPress={onPress}>
        <Text style={styles.label}>NO UPCOMING SESSIONS</Text>
        <Text style={styles.cta}>BOOK YOUR NEXT SESSION</Text>
      </TouchableOpacity>
    );
  }

  const sessionDate = new Date(booking.date + 'T00:00:00');
  const now = new Date();
  const diffDays = Math.ceil((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  const displayType = booking.session_type === '1-on-1' ? '1-ON-1 TRAINING' : 'SMALL GROUP TRAINING';
  const monthDay = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Text style={styles.label}>NEXT SESSION</Text>
      <Text style={styles.type}>{displayType}</Text>
      <View style={styles.details}>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>DATE</Text>
          <Text style={styles.detailValue}>{monthDay}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>TIME</Text>
          <Text style={styles.detailValue}>{booking.time}</Text>
        </View>
        <View style={styles.detail}>
          <Text style={styles.detailLabel}>DURATION</Text>
          <Text style={styles.detailValue}>{booking.duration_min} min</Text>
        </View>
      </View>
      <View style={styles.countdown}>
        <Text style={styles.countdownNum}>{Math.max(0, diffDays)}</Text>
        <Text style={styles.countdownUnit}>{diffDays === 1 ? 'DAY' : 'DAYS'}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.goldSubtle,
    borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20, padding: 20, marginBottom: 24,
    position: 'relative',
  },
  label: { fontSize: 10, letterSpacing: 3, color: Colors.vegasGold, fontFamily: Fonts.bodyMedium, marginBottom: 12 },
  type: { fontFamily: Fonts.display, fontSize: 24, color: Colors.white, letterSpacing: 1 },
  cta: { fontFamily: Fonts.display, fontSize: 20, color: Colors.vegasGold, letterSpacing: 1, marginTop: 8 },
  details: { flexDirection: 'row', gap: 24, marginTop: 12 },
  detail: { gap: 2 },
  detailLabel: { fontSize: 9, letterSpacing: 2, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium },
  detailValue: { fontSize: 14, color: Colors.white, fontFamily: Fonts.bodySemiBold },
  countdown: { position: 'absolute', top: 20, right: 20, alignItems: 'flex-end' },
  countdownNum: { fontFamily: Fonts.display, fontSize: 36, color: Colors.vegasGold, lineHeight: 36 },
  countdownUnit: { fontSize: 9, letterSpacing: 2, color: Colors.goldMuted, fontFamily: Fonts.bodyMedium },
});
```

- [ ] **Step 2: Create StatCard.tsx**

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../lib/constants';

interface Props {
  value: number;
  label: string;
}

export function StatCard({ value, label }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: Colors.whiteSubtle,
    borderWidth: 1, borderColor: Colors.whiteBorder,
    borderRadius: 16, padding: 16, alignItems: 'center',
  },
  value: { fontFamily: Fonts.display, fontSize: 28, color: Colors.vegasGold, lineHeight: 28 },
  label: { fontSize: 9, letterSpacing: 2, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium, marginTop: 4 },
});
```

- [ ] **Step 3: Create DrillCard.tsx**

```typescript
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, Fonts } from '../lib/constants';

interface Props {
  name: string;
  duration: string;
  badge: string; // difficulty or intensity
  category?: string;
  isAI?: boolean;
  isFeatured?: boolean;
  onPress: () => void;
}

export function DrillCard({ name, duration, badge, category, isAI, isFeatured, onPress }: Props) {
  return (
    <TouchableOpacity style={[styles.card, isFeatured && styles.featured]} onPress={onPress}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{name}</Text>
          <View style={styles.meta}>
            {category ? <Text style={styles.tag}>{category}</Text> : null}
            <Text style={styles.duration}>{duration}</Text>
            <Text style={styles.badge}>{badge}</Text>
          </View>
        </View>
        {isAI ? (
          <View style={styles.aiBadge}>
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.whiteSubtle,
    borderWidth: 1, borderColor: Colors.whiteBorder,
    borderRadius: 16, padding: 16, marginBottom: 10,
  },
  featured: {
    borderColor: Colors.vegasGold,
    backgroundColor: Colors.goldSubtle,
  },
  row: { flexDirection: 'row', alignItems: 'center' },
  name: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.white, marginBottom: 6 },
  meta: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  tag: { fontSize: 11, color: Colors.vegasGold, fontFamily: Fonts.bodyMedium },
  duration: { fontSize: 11, color: Colors.whiteMuted, fontFamily: Fonts.body },
  badge: { fontSize: 11, color: Colors.whiteMuted, fontFamily: Fonts.body },
  aiBadge: {
    backgroundColor: Colors.goldSubtle, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
  },
  aiBadgeText: { fontSize: 10, fontFamily: Fonts.bodySemiBold, color: Colors.vegasGold, letterSpacing: 1 },
});
```

- [ ] **Step 4: Commit**

```bash
git add components/
git commit -m "feat: add SessionCard, StatCard, DrillCard components"
```

---

### Task 11: Full Home screen

**Files:**
- Modify: `app/(tabs)/index.tsx`
- Create: `components/WeekCalendar.tsx`
- Create: `components/LogActivityModal.tsx`

- [ ] **Step 1: Create WeekCalendar.tsx**

```typescript
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Fonts } from '../lib/constants';

interface Props {
  bookedDates: string[]; // YYYY-MM-DD strings
}

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export function WeekCalendar({ bookedDates }: Props) {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - dayOfWeek);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const isToday = d.toDateString() === today.toDateString();
    const hasSession = bookedDates.includes(dateStr);
    return { label: DAY_LABELS[i], num: d.getDate(), isToday, hasSession };
  });

  return (
    <View style={styles.row}>
      {days.map((day, i) => (
        <View key={i} style={[styles.cell, day.isToday && styles.today]}>
          <Text style={styles.dayName}>{day.label}</Text>
          <Text style={[styles.dayNum, day.isToday && styles.todayNum]}>{day.num}</Text>
          {day.hasSession && <View style={styles.dot} />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, marginBottom: 20 },
  cell: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 14, backgroundColor: Colors.whiteSubtle,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.04)',
  },
  today: { backgroundColor: Colors.goldSubtle, borderColor: Colors.goldBorder },
  dayName: { fontSize: 10, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium, letterSpacing: 1, marginBottom: 4 },
  dayNum: { fontSize: 16, color: 'rgba(255,255,255,0.7)', fontFamily: Fonts.bodySemiBold },
  todayNum: { color: Colors.vegasGold },
  dot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: Colors.vegasGold, marginTop: 4,
  },
});
```

- [ ] **Step 2: Create LogActivityModal.tsx**

```typescript
import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { Colors, Fonts } from '../lib/constants';

interface Props {
  visible: boolean;
  onClose: () => void;
  onLog: (durationMin: number, notes: string) => void;
}

export function LogActivityModal({ visible, onClose, onLog }: Props) {
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLog = async () => {
    setLoading(true);
    await onLog(parseInt(duration) || 60, notes);
    setDuration('60');
    setNotes('');
    setLoading(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.title}>LOG ACTIVITY</Text>
          <Text style={styles.subtitle}>I trained today</Text>

          <Text style={styles.label}>DURATION (MINUTES)</Text>
          <TextInput
            style={styles.input}
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
            placeholderTextColor={Colors.whiteMuted}
          />

          <Text style={styles.label}>NOTES (OPTIONAL)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            value={notes}
            onChangeText={setNotes}
            multiline
            placeholder="What did you work on?"
            placeholderTextColor={Colors.whiteMuted}
          />

          <TouchableOpacity style={styles.button} onPress={handleLog} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'LOGGING...' : 'LOG ACTIVITY'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: Colors.darkNavy, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  title: { fontFamily: Fonts.display, fontSize: 24, color: Colors.white, letterSpacing: 2 },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.whiteMuted, marginBottom: 24 },
  label: { fontSize: 10, letterSpacing: 2, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium, marginBottom: 8 },
  input: {
    fontFamily: Fonts.body, fontSize: 16, color: Colors.white,
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
    borderRadius: 14, padding: 16, marginBottom: 16,
  },
  button: { backgroundColor: Colors.vegasGold, borderRadius: 14, padding: 16, marginTop: 8 },
  buttonText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.darkNavy, textAlign: 'center', letterSpacing: 2 },
  cancel: { marginTop: 16, alignSelf: 'center' },
  cancelText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.whiteMuted },
});
```

- [ ] **Step 3: Build full Home screen**

Replace `app/(tabs)/index.tsx`:

```typescript
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Fonts } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';
import { getUpcomingBookings, getActivityStats, logActivity } from '../../lib/database';
import { SessionCard } from '../../components/SessionCard';
import { StatCard } from '../../components/StatCard';
import { WeekCalendar } from '../../components/WeekCalendar';
import { LogActivityModal } from '../../components/LogActivityModal';
import { Booking } from '../../lib/types';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 17) return 'Good afternoon,';
  return 'Good evening,';
}

export default function HomeScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState({ sessions: 0, hours: 0, streak: 0 });
  const [showLog, setShowLog] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      getUpcomingBookings(user.id).then(setBookings).catch(console.error);
      getActivityStats(user.id).then(setStats).catch(console.error);
    }, [user])
  );

  const bookedDates = bookings.map(b => b.date);
  const nextBooking = bookings[0] ?? null;

  const handleLogActivity = async (durationMin: number, notes: string) => {
    if (!user) return;
    await logActivity({
      user_id: user.id,
      date: new Date().toISOString().split('T')[0],
      duration_min: durationMin,
      notes: notes || null,
    });
    const updated = await getActivityStats(user.id);
    setStats(updated);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.name}>{profile?.first_name?.toUpperCase() || 'PLAYER'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} style={styles.avatar}>
            <Text style={styles.avatarText}>{profile?.first_name?.[0] || 'P'}</Text>
          </TouchableOpacity>
        </View>

        <SessionCard booking={nextBooking} onPress={() => router.push('/(tabs)/booking')} />

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>THIS WEEK</Text>
        </View>
        <WeekCalendar bookedDates={bookedDates} />

        <TouchableOpacity style={styles.bookBtn} onPress={() => router.push('/(tabs)/booking')}>
          <Text style={styles.bookBtnText}>BOOK A SESSION</Text>
        </TouchableOpacity>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>YOUR PROGRESS</Text>
        </View>
        <View style={styles.statRow}>
          <StatCard value={stats.sessions} label="SESSIONS" />
          <StatCard value={stats.hours} label="HOURS" />
          <StatCard value={stats.streak} label="WEEK STREAK" />
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowLog(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <LogActivityModal visible={showLog} onClose={() => setShowLog(false)} onLog={handleLogActivity} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkNavy },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  greeting: { fontFamily: Fonts.body, fontSize: 14, color: Colors.whiteMuted },
  name: { fontFamily: Fonts.display, fontSize: 32, color: Colors.white, letterSpacing: 2, marginTop: 2 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.goldSubtle, borderWidth: 1, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.vegasGold },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  sectionTitle: { fontSize: 11, letterSpacing: 3, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium },
  bookBtn: {
    backgroundColor: Colors.vegasGold, borderRadius: 14, padding: 16, marginBottom: 24,
  },
  bookBtnText: {
    fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.darkNavy,
    textAlign: 'center', letterSpacing: 2,
  },
  statRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  fab: {
    position: 'absolute', bottom: 100, right: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.vegasGold,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  fabText: { fontSize: 28, color: Colors.darkNavy, fontWeight: '600', lineHeight: 30 },
});
```

- [ ] **Step 4: Commit**

```bash
git add app/(tabs)/index.tsx components/WeekCalendar.tsx components/LogActivityModal.tsx
git commit -m "feat: build full Home screen with sessions, calendar, stats, activity logging"
```

---

## Chunk 4: Booking Flow

### Task 12: Booking screens

**Files:**
- Create: `app/(tabs)/booking.tsx`
- Create: `app/(tabs)/booking-confirmation.tsx`

- [ ] **Step 1: Create booking.tsx**

```typescript
import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../../lib/constants';
import { useAuth } from '../../contexts/AuthContext';
import { getAvailability, bookSession } from '../../lib/api';
import { insertBooking } from '../../lib/database';

function formatTime12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
}

const SESSION_TYPES = [
  { slug: '1-on-1', label: '1-on-1 Training', duration: 60, price: '$50' },
  { slug: 'small-group', label: 'Small Group', duration: 90, price: '$40/player' },
];

export default function BookingScreen() {
  const { profile, user } = useAuth();
  const router = useRouter();
  const [sessionType, setSessionType] = useState(SESSION_TYPES[0]);
  const [selectedDate, setSelectedDate] = useState('');
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [booking, setBooking] = useState(false);

  // Generate next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return {
      value: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      dayOfWeek: d.getDay(),
    };
  }).filter(d => d.dayOfWeek !== 0); // Filter out Sundays

  useEffect(() => {
    if (!selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime('');
    getAvailability(selectedDate, sessionType.slug)
      .then(res => setSlots(res.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [selectedDate, sessionType]);

  const handleBook = async () => {
    if (!profile || !user) return;
    if (!profile.phone) {
      Alert.alert('Phone Required', 'Please add your phone number in your profile before booking.', [
        { text: 'Go to Profile', onPress: () => router.push('/profile') },
        { text: 'Cancel' },
      ]);
      return;
    }

    setBooking(true);
    try {
      const res = await bookSession({
        name: `${profile.first_name} ${profile.last_name}`,
        email: profile.email,
        phone: profile.phone,
        sessionType: sessionType.slug,
        date: selectedDate,
        time: selectedTime,
      });

      await insertBooking({
        user_id: user.id,
        session_type: sessionType.slug as '1-on-1' | 'small-group',
        date: selectedDate,
        time: formatTime12(selectedTime),
        duration_min: sessionType.duration,
        calendar_event_id: res.booking.calendarEventId || null,
      });

      router.replace({
        pathname: '/(tabs)/booking-confirmation',
        params: { date: selectedDate, time: selectedTime, type: sessionType.label },
      });
    } catch (err: any) {
      Alert.alert('Booking Failed', err.message || 'Something went wrong. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>BOOK A SESSION</Text>

        <Text style={styles.label}>SESSION TYPE</Text>
        <View style={styles.typeRow}>
          {SESSION_TYPES.map(t => (
            <TouchableOpacity
              key={t.slug}
              style={[styles.typeChip, sessionType.slug === t.slug && styles.typeChipActive]}
              onPress={() => setSessionType(t)}
            >
              <Text style={[styles.typeText, sessionType.slug === t.slug && styles.typeTextActive]}>
                {t.label}
              </Text>
              <Text style={[styles.typePrice, sessionType.slug === t.slug && styles.typeTextActive]}>
                {t.price}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>SELECT DATE</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
          {dates.map(d => (
            <TouchableOpacity
              key={d.value}
              style={[styles.dateChip, selectedDate === d.value && styles.dateChipActive]}
              onPress={() => setSelectedDate(d.value)}
            >
              <Text style={[styles.dateText, selectedDate === d.value && styles.dateTextActive]}>
                {d.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {selectedDate ? (
          <>
            <Text style={styles.label}>SELECT TIME</Text>
            {loadingSlots ? (
              <ActivityIndicator color={Colors.vegasGold} style={{ marginVertical: 20 }} />
            ) : slots.length === 0 ? (
              <Text style={styles.noSlots}>No available slots for this date.</Text>
            ) : (
              <View style={styles.slotGrid}>
                {slots.map(slot => (
                  <TouchableOpacity
                    key={slot}
                    style={[styles.slotChip, selectedTime === slot && styles.slotChipActive]}
                    onPress={() => setSelectedTime(slot)}
                  >
                    <Text style={[styles.slotText, selectedTime === slot && styles.slotTextActive]}>
                      {formatTime12(slot)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : null}

        {selectedTime ? (
          <TouchableOpacity style={styles.confirmBtn} onPress={handleBook} disabled={booking}>
            <Text style={styles.confirmText}>{booking ? 'BOOKING...' : 'CONFIRM BOOKING'}</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkNavy },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  back: { fontFamily: Fonts.body, fontSize: 14, color: Colors.vegasGold, marginBottom: 16 },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.white, letterSpacing: 2, marginBottom: 24 },
  label: { fontSize: 10, letterSpacing: 3, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium, marginBottom: 12, marginTop: 20 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeChip: {
    flex: 1, padding: 16, borderRadius: 14,
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
  },
  typeChipActive: { backgroundColor: Colors.goldSubtle, borderColor: Colors.goldBorder },
  typeText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.whiteMuted },
  typePrice: { fontFamily: Fonts.body, fontSize: 12, color: Colors.whiteMuted, marginTop: 4 },
  typeTextActive: { color: Colors.vegasGold },
  dateScroll: { marginBottom: 8 },
  dateChip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8,
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
  },
  dateChipActive: { backgroundColor: Colors.goldSubtle, borderColor: Colors.goldBorder },
  dateText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.whiteMuted },
  dateTextActive: { color: Colors.vegasGold },
  noSlots: { fontFamily: Fonts.body, fontSize: 13, color: Colors.whiteMuted, marginVertical: 20 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotChip: {
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 14,
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
  },
  slotChipActive: { backgroundColor: Colors.goldSubtle, borderColor: Colors.goldBorder },
  slotText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.whiteMuted },
  slotTextActive: { color: Colors.vegasGold },
  confirmBtn: { backgroundColor: Colors.vegasGold, borderRadius: 14, padding: 16, marginTop: 32 },
  confirmText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.darkNavy, textAlign: 'center', letterSpacing: 2 },
});
```

- [ ] **Step 2: Create booking-confirmation.tsx**

```typescript
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts } from '../../lib/constants';

export default function BookingConfirmation() {
  const router = useRouter();
  const { date, time, type } = useLocalSearchParams<{ date: string; time: string; type: string }>();

  const displayDate = date ? new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  }) : '';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.check}>&#10003;</Text>
        <Text style={styles.title}>BOOKED</Text>
        <Text style={styles.subtitle}>You're all set.</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>SESSION</Text>
          <Text style={styles.cardValue}>{type}</Text>
          <Text style={styles.cardLabel}>DATE</Text>
          <Text style={styles.cardValue}>{displayDate}</Text>
          <Text style={styles.cardLabel}>TIME</Text>
          <Text style={styles.cardValue}>{time}</Text>
        </View>

        <Text style={styles.note}>A confirmation email has been sent.</Text>

        <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.buttonText}>BACK TO HOME</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkNavy },
  container: { flex: 1, justifyContent: 'center', padding: 24, alignItems: 'center' },
  check: { fontSize: 48, color: Colors.vegasGold, marginBottom: 16 },
  title: { fontFamily: Fonts.display, fontSize: 36, color: Colors.white, letterSpacing: 4 },
  subtitle: { fontFamily: Fonts.body, fontSize: 14, color: Colors.whiteMuted, marginBottom: 32 },
  card: {
    backgroundColor: Colors.goldSubtle, borderWidth: 1, borderColor: Colors.goldBorder,
    borderRadius: 20, padding: 24, width: '100%', marginBottom: 24,
  },
  cardLabel: { fontSize: 10, letterSpacing: 2, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium, marginTop: 12 },
  cardValue: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.white, marginTop: 4 },
  note: { fontFamily: Fonts.body, fontSize: 13, color: Colors.whiteMuted, marginBottom: 32 },
  button: { backgroundColor: Colors.vegasGold, borderRadius: 14, padding: 16, width: '100%' },
  buttonText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.darkNavy, textAlign: 'center', letterSpacing: 2 },
});
```

- [ ] **Step 3: Commit**

```bash
git add app/(tabs)/booking.tsx app/(tabs)/booking-confirmation.tsx
git commit -m "feat: add booking flow with date/time selection and confirmation"
```

---

## Chunk 5: AI Drills Screens

### Task 13: Drills Home screen

**Files:**
- Modify: `app/(tabs)/drills/index.tsx`

- [ ] **Step 1: Build full Drills Home**

Replace `app/(tabs)/drills/index.tsx`:

```typescript
import { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors, Fonts } from '../../../lib/constants';
import { useAuth } from '../../../contexts/AuthContext';
import { getDrills } from '../../../lib/api';
import { getSavedDrills } from '../../../lib/database';
import { DrillCard } from '../../../components/DrillCard';
import { CuratedDrill, SavedDrill } from '../../../lib/types';

const CATEGORIES = ['All', 'Dribbling', 'Shooting', 'Passing', 'Defending', 'Fitness'];

export default function DrillsHome() {
  const { user } = useAuth();
  const router = useRouter();
  const [category, setCategory] = useState('All');
  const [curated, setCurated] = useState<CuratedDrill[]>([]);
  const [featured, setFeatured] = useState<CuratedDrill | null>(null);
  const [saved, setSaved] = useState<SavedDrill[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([
        getDrills(category),
        user ? getSavedDrills(user.id) : Promise.resolve([]),
      ])
        .then(([drillsRes, savedRes]) => {
          setCurated(drillsRes.drills);
          setFeatured(drillsRes.featured);
          setSaved(savedRes);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }, [category, user])
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>AI DRILL COACH</Text>
        <Text style={styles.subtitle}>Train smarter. Train Fantasma.</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {CATEGORIES.map(c => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, category === c && styles.chipActive]}
              onPress={() => setCategory(c)}
            >
              <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color={Colors.vegasGold} style={{ marginVertical: 40 }} />
        ) : (
          <>
            {featured ? (
              <>
                <Text style={styles.sectionTitle}>FEATURED DRILL</Text>
                <DrillCard
                  name={featured.name}
                  duration={featured.duration}
                  badge={featured.difficulty}
                  category={featured.category}
                  isFeatured
                  onPress={() => router.push({ pathname: '/(tabs)/drills/[id]', params: { id: featured.id, source: 'curated' } })}
                />
              </>
            ) : null}

            <Text style={styles.sectionTitle}>DRILLS</Text>
            {curated.map(drill => (
              <DrillCard
                key={drill.id}
                name={drill.name}
                duration={drill.duration}
                badge={drill.difficulty}
                category={drill.category}
                onPress={() => router.push({ pathname: '/(tabs)/drills/[id]', params: { id: drill.id, source: 'curated' } })}
              />
            ))}

            {saved.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>YOUR SAVED DRILLS</Text>
                {saved.map(drill => (
                  <DrillCard
                    key={drill.id}
                    name={drill.name}
                    duration={drill.duration}
                    badge={drill.intensity}
                    isAI
                    onPress={() => router.push({ pathname: '/(tabs)/drills/[id]', params: { id: drill.id, source: 'saved' } })}
                  />
                ))}
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.generateBtn} onPress={() => router.push('/(tabs)/drills/generate')}>
        <Text style={styles.generateText}>GENERATE CUSTOM DRILL</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkNavy },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.white, letterSpacing: 2, marginTop: 12 },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.whiteMuted, marginTop: 4, marginBottom: 20 },
  chips: { marginBottom: 20 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8,
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
  },
  chipActive: { backgroundColor: Colors.goldSubtle, borderColor: Colors.goldBorder },
  chipText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.whiteMuted },
  chipTextActive: { color: Colors.vegasGold },
  sectionTitle: { fontSize: 11, letterSpacing: 3, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium, marginBottom: 14 },
  generateBtn: {
    position: 'absolute', bottom: 100, left: 20, right: 20,
    backgroundColor: Colors.vegasGold, borderRadius: 14, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 8,
  },
  generateText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.darkNavy, textAlign: 'center', letterSpacing: 2 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/drills/index.tsx
git commit -m "feat: build Drills Home with curated list, saved drills, category filter"
```

---

### Task 14: Generate Drill screen

**Files:**
- Create: `app/(tabs)/drills/generate.tsx`

- [ ] **Step 1: Create generate.tsx**

```typescript
import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../../../lib/constants';
import { useAuth } from '../../../contexts/AuthContext';
import { generateDrill, GeneratedDrill } from '../../../lib/api';
import { insertSavedDrill } from '../../../lib/database';

const FOCUS_AREAS = [
  { label: 'First Touch', emoji: '\u{1F3AF}' },
  { label: 'Speed', emoji: '\u{1F4A8}' },
  { label: 'Dribbling', emoji: '\u{1F93E}' },
  { label: 'Shooting', emoji: '\u{1F94A}' },
  { label: 'Vision', emoji: '\u{1F441}' },
  { label: 'Defending', emoji: '\u{1F4AA}' },
];

const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export default function GenerateDrill() {
  const { user } = useAuth();
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [difficulty, setDifficulty] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GeneratedDrill | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleFocus = (label: string) => {
    const next = new Set(selected);
    next.has(label) ? next.delete(label) : next.add(label);
    setSelected(next);
  };

  const handleGenerate = async () => {
    if (selected.size === 0) {
      Alert.alert('Select Focus Areas', 'Pick at least one area to focus on.');
      return;
    }
    setGenerating(true);
    setResult(null);
    try {
      const drill = await generateDrill(Array.from(selected), difficulty || undefined);
      setResult(drill);
    } catch {
      Alert.alert('Error', 'Failed to generate drill. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!result || !user) return;
    setSaving(true);
    try {
      await insertSavedDrill({
        user_id: user.id,
        name: result.name,
        description: result.description,
        steps: result.steps,
        duration: result.duration,
        intensity: result.intensity as 'Low' | 'Medium' | 'High',
        equipment: result.equipment,
        focus_areas: Array.from(selected),
      });
      Alert.alert('Saved', 'Drill added to your library.');
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to save drill.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>GENERATE DRILL</Text>
        <Text style={styles.subtitle}>Tell us what to work on. We'll build the drill.</Text>

        <Text style={styles.label}>WHAT DO YOU WANT TO IMPROVE?</Text>
        <View style={styles.focusGrid}>
          {FOCUS_AREAS.map(f => (
            <TouchableOpacity
              key={f.label}
              style={[styles.focusCard, selected.has(f.label) && styles.focusCardActive]}
              onPress={() => toggleFocus(f.label)}
            >
              <Text style={styles.focusEmoji}>{f.emoji}</Text>
              <Text style={[styles.focusText, selected.has(f.label) && styles.focusTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>DIFFICULTY (OPTIONAL)</Text>
        <View style={styles.diffRow}>
          {DIFFICULTIES.map(d => (
            <TouchableOpacity
              key={d}
              style={[styles.diffChip, difficulty === d && styles.diffChipActive]}
              onPress={() => setDifficulty(difficulty === d ? '' : d)}
            >
              <Text style={[styles.diffText, difficulty === d && styles.diffTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.genBtn} onPress={handleGenerate} disabled={generating}>
          <Text style={styles.genBtnText}>{generating ? 'GENERATING...' : 'GENERATE DRILL PLAN'}</Text>
        </TouchableOpacity>

        {generating ? (
          <ActivityIndicator color={Colors.vegasGold} size="large" style={{ marginVertical: 40 }} />
        ) : null}

        {result ? (
          <View style={styles.resultCard}>
            <View style={styles.aiBadge}>
              <View style={styles.aiBadgeDot} />
              <Text style={styles.aiBadgeText}>AI GENERATED</Text>
            </View>
            <Text style={styles.drillName}>{result.name}</Text>
            <Text style={styles.drillDesc}>{result.description}</Text>

            <View style={styles.metaRow}>
              <Text style={styles.metaText}>{result.duration}</Text>
              <Text style={styles.metaText}>{result.intensity} Intensity</Text>
              <Text style={styles.metaText}>{result.equipment}</Text>
            </View>

            {result.steps.map((step, i) => (
              <View key={i} style={styles.step}>
                <View style={styles.stepNum}>
                  <Text style={styles.stepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}

            <View style={styles.actions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE TO LIBRARY'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.regenBtn} onPress={handleGenerate}>
                <Text style={styles.regenBtnText}>REGENERATE</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkNavy },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  back: { fontFamily: Fonts.body, fontSize: 14, color: Colors.vegasGold, marginBottom: 16 },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.white, letterSpacing: 2 },
  subtitle: { fontFamily: Fonts.body, fontSize: 13, color: Colors.whiteMuted, marginTop: 4, marginBottom: 24 },
  label: { fontSize: 10, letterSpacing: 3, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium, marginBottom: 12 },
  focusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  focusCard: {
    width: '48%', flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 14, borderRadius: 14,
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
  },
  focusCardActive: { backgroundColor: Colors.goldSubtle, borderColor: Colors.goldBorder },
  focusEmoji: { fontSize: 22 },
  focusText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.whiteMuted },
  focusTextActive: { color: Colors.vegasGold },
  diffRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  diffChip: {
    flex: 1, paddingVertical: 10, borderRadius: 20, alignItems: 'center',
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
  },
  diffChipActive: { backgroundColor: Colors.goldSubtle, borderColor: Colors.goldBorder },
  diffText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.whiteMuted },
  diffTextActive: { color: Colors.vegasGold },
  genBtn: { backgroundColor: Colors.vegasGold, borderRadius: 14, padding: 14, marginBottom: 24 },
  genBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.darkNavy, textAlign: 'center', letterSpacing: 2 },
  resultCard: {
    backgroundColor: 'rgba(197,179,88,0.04)', borderWidth: 1, borderColor: 'rgba(197,179,88,0.1)',
    borderRadius: 20, padding: 20,
  },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  aiBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.vegasGold },
  aiBadgeText: { fontSize: 10, letterSpacing: 2, color: Colors.vegasGold, fontFamily: Fonts.bodySemiBold },
  drillName: { fontFamily: Fonts.display, fontSize: 22, color: Colors.white, letterSpacing: 1, marginBottom: 8 },
  drillDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.whiteMuted, lineHeight: 20, marginBottom: 16 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  metaText: { fontSize: 12, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium },
  step: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.goldSubtle, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.vegasGold },
  stepText: { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  saveBtn: {
    flex: 1, padding: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(197,179,88,0.15)', borderWidth: 1, borderColor: 'rgba(197,179,88,0.25)',
  },
  saveBtnText: { fontSize: 12, fontFamily: Fonts.bodySemiBold, color: Colors.vegasGold, letterSpacing: 1 },
  regenBtn: {
    flex: 1, padding: 12, borderRadius: 12, alignItems: 'center',
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
  },
  regenBtnText: { fontSize: 12, fontFamily: Fonts.bodySemiBold, color: Colors.whiteMuted, letterSpacing: 1 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/drills/generate.tsx
git commit -m "feat: add AI drill generation screen with focus area picker"
```

---

### Task 15: Drill Detail screen

**Files:**
- Create: `app/(tabs)/drills/[id].tsx`

- [ ] **Step 1: Create [id].tsx**

```typescript
import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors, Fonts } from '../../../lib/constants';
import { useAuth } from '../../../contexts/AuthContext';
import { getDrills } from '../../../lib/api';
import { getSavedDrills, deleteSavedDrill } from '../../../lib/database';
import { CuratedDrill, SavedDrill } from '../../../lib/types';

export default function DrillDetail() {
  const router = useRouter();
  const { user } = useAuth();
  const { id, source } = useLocalSearchParams<{ id: string; source: 'curated' | 'saved' }>();
  const [drill, setDrill] = useState<CuratedDrill | SavedDrill | null>(null);

  useEffect(() => {
    if (source === 'curated') {
      getDrills().then(res => {
        const found = res.drills.find(d => d.id === id);
        if (found) setDrill(found);
      });
    } else if (source === 'saved' && user) {
      getSavedDrills(user.id).then(drills => {
        const found = drills.find(d => d.id === id);
        if (found) setDrill(found);
      });
    }
  }, [id, source, user]);

  const isSaved = source === 'saved';
  const badgeText = drill
    ? isSaved
      ? (drill as SavedDrill).intensity
      : (drill as CuratedDrill).difficulty
    : '';

  const handleDelete = () => {
    Alert.alert('Remove Drill', 'Remove this drill from your library?', [
      { text: 'Cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await deleteSavedDrill(id!);
          router.back();
        },
      },
    ]);
  };

  if (!drill) return <View style={styles.safe} />;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Back</Text>
        </TouchableOpacity>

        {isSaved ? (
          <View style={styles.aiBadge}>
            <View style={styles.aiBadgeDot} />
            <Text style={styles.aiBadgeText}>AI GENERATED</Text>
          </View>
        ) : null}

        <Text style={styles.name}>{drill.name}</Text>
        <Text style={styles.desc}>{drill.description}</Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{drill.duration}</Text>
          <Text style={styles.metaText}>{badgeText}</Text>
          <Text style={styles.metaText}>{drill.equipment}</Text>
        </View>

        <Text style={styles.sectionTitle}>STEPS</Text>
        {drill.steps.map((step, i) => (
          <View key={i} style={styles.step}>
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
            <Text style={styles.stepText}>{step}</Text>
          </View>
        ))}

        {isSaved ? (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
            <Text style={styles.deleteBtnText}>REMOVE FROM LIBRARY</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkNavy },
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 100 },
  back: { fontFamily: Fonts.body, fontSize: 14, color: Colors.vegasGold, marginBottom: 16 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  aiBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.vegasGold },
  aiBadgeText: { fontSize: 10, letterSpacing: 2, color: Colors.vegasGold, fontFamily: Fonts.bodySemiBold },
  name: { fontFamily: Fonts.display, fontSize: 28, color: Colors.white, letterSpacing: 2, marginBottom: 8 },
  desc: { fontFamily: Fonts.body, fontSize: 14, color: Colors.whiteMuted, lineHeight: 22, marginBottom: 20 },
  metaRow: { flexDirection: 'row', gap: 16, marginBottom: 24 },
  metaText: { fontSize: 12, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium },
  sectionTitle: { fontSize: 11, letterSpacing: 3, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium, marginBottom: 14 },
  step: { flexDirection: 'row', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  stepNum: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: Colors.goldSubtle, alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.vegasGold },
  stepText: { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20 },
  deleteBtn: {
    marginTop: 32, padding: 14, borderRadius: 14, alignItems: 'center',
    borderWidth: 1, borderColor: '#FF6B6B',
  },
  deleteBtnText: { fontSize: 12, fontFamily: Fonts.bodySemiBold, color: '#FF6B6B', letterSpacing: 1 },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/drills/\[id\].tsx
git commit -m "feat: add Drill Detail screen with curated/saved drill display"
```

---

## Chunk 6: Profile Screen + Final Polish

### Task 16: Profile screen

**Files:**
- Create: `app/profile.tsx`

- [ ] **Step 1: Create profile.tsx**

```typescript
import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Fonts } from '../lib/constants';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../lib/database';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(profile?.first_name || '');
  const [lastName, setLastName] = useState(profile?.last_name || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user.id, { first_name: firstName, last_name: lastName, phone: phone || undefined });
      await refreshProfile();
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>Close</Text>
        </TouchableOpacity>

        <Text style={styles.title}>PROFILE</Text>

        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{profile?.first_name?.[0] || 'P'}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>FIRST NAME</Text>
          {editing ? (
            <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} />
          ) : (
            <Text style={styles.value}>{profile?.first_name}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>LAST NAME</Text>
          {editing ? (
            <TextInput style={styles.input} value={lastName} onChangeText={setLastName} />
          ) : (
            <Text style={styles.value}>{profile?.last_name}</Text>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>EMAIL</Text>
          <Text style={styles.value}>{profile?.email}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>PHONE {!profile?.phone ? '(required for booking)' : ''}</Text>
          {editing ? (
            <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="412-555-1234" placeholderTextColor={Colors.whiteMuted} />
          ) : (
            <Text style={styles.value}>{profile?.phone || 'Not set'}</Text>
          )}
        </View>

        {editing ? (
          <View style={styles.editActions}>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'SAVING...' : 'SAVE'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setEditing(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
            <Text style={styles.editBtnText}>EDIT PROFILE</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>SIGN OUT</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Fantasma App v1.0.0</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.darkNavy },
  container: { flex: 1, padding: 24 },
  back: { fontFamily: Fonts.body, fontSize: 14, color: Colors.vegasGold, marginBottom: 16 },
  title: { fontFamily: Fonts.display, fontSize: 28, color: Colors.white, letterSpacing: 2, marginBottom: 24 },
  avatarCircle: {
    width: 72, height: 72, borderRadius: 36, alignSelf: 'center',
    backgroundColor: Colors.goldSubtle, borderWidth: 2, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center', marginBottom: 32,
  },
  avatarText: { fontFamily: Fonts.display, fontSize: 28, color: Colors.vegasGold },
  field: { marginBottom: 20 },
  label: { fontSize: 10, letterSpacing: 2, color: Colors.whiteMuted, fontFamily: Fonts.bodyMedium, marginBottom: 4 },
  value: { fontFamily: Fonts.bodySemiBold, fontSize: 16, color: Colors.white },
  input: {
    fontFamily: Fonts.body, fontSize: 16, color: Colors.white,
    backgroundColor: Colors.whiteSubtle, borderWidth: 1, borderColor: Colors.whiteBorder,
    borderRadius: 14, padding: 14,
  },
  editActions: { gap: 12, marginTop: 8 },
  saveBtn: { backgroundColor: Colors.vegasGold, borderRadius: 14, padding: 14 },
  saveBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.darkNavy, textAlign: 'center', letterSpacing: 2 },
  cancelText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.whiteMuted, textAlign: 'center' },
  editBtn: {
    marginTop: 8, padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.goldBorder,
  },
  editBtnText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: Colors.vegasGold, textAlign: 'center', letterSpacing: 2 },
  signOutBtn: {
    marginTop: 'auto', padding: 14, borderRadius: 14,
    borderWidth: 1, borderColor: '#FF6B6B',
  },
  signOutText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, color: '#FF6B6B', textAlign: 'center', letterSpacing: 2 },
  version: { fontFamily: Fonts.body, fontSize: 11, color: Colors.whiteMuted, textAlign: 'center', marginTop: 16 },
});
```

- [ ] **Step 2: Register profile as modal in root layout**

Update `app/_layout.tsx` — replace `<Slot />` in `RootNavigator` with a Stack that presents profile as modal:

```typescript
// In RootNavigator, replace: return <Slot />;
// With:
return (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="(auth)" />
    <Stack.Screen name="(tabs)" />
    <Stack.Screen name="profile" options={{ presentation: 'modal' }} />
  </Stack>
);
```

(Add `import { Stack } from 'expo-router';` at the top)

- [ ] **Step 3: Commit**

```bash
git add app/profile.tsx app/_layout.tsx
git commit -m "feat: add Profile screen as modal with edit and sign-out"
```

---

### Task 17: Hide booking screens from tab bar

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

- [ ] **Step 1: Add tab bar hiding for booking screens**

In `app/(tabs)/_layout.tsx`, add these two `<Tabs.Screen>` entries inside the `<Tabs>` component, after the existing `drills` screen entry:

```typescript
      <Tabs.Screen
        name="drills"
        options={{
          title: 'Drills',
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 20, color }}>&#9889;</Text>
          ),
        }}
      />
      {/* Add these two lines to hide booking screens from tab bar */}
      <Tabs.Screen name="booking" options={{ href: null }} />
      <Tabs.Screen name="booking-confirmation" options={{ href: null }} />
    </Tabs>
```

- [ ] **Step 2: Commit**

```bash
git add app/(tabs)/_layout.tsx
git commit -m "fix: hide booking screens from tab bar"
```

---

### Task 18: Final verification

- [ ] **Step 1: Run the full app**

```bash
cd C:\Users\conhu\fantasma-app
npx expo start
```

Expected: Metro bundler starts, QR code displayed, no TypeScript errors.

- [ ] **Step 2: Test the complete flow**

1. Launch app → see sign-in screen
2. Sign up with name, email, password → lands on Home
3. Home shows greeting, empty next session card (CTA), weekly calendar, stats at 0
4. Tap profile icon → modal with info, edit, sign out
5. Add phone number in profile
6. Tap "Book a Session" → pick date → see time slots → confirm → see confirmation
7. Go back to Home → next session card populated, calendar dot visible
8. Tap "+" FAB → log activity → stats update
9. Switch to Drills tab → see curated drills, category filter works
10. Tap "Generate Custom Drill" → pick focus areas → generate → see result → save
11. Back on Drills Home → saved drill appears in "Your Saved Drills"
12. Tap into a drill → see full detail → can remove saved drills

- [ ] **Step 3: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final polish and fixes"
```
