-- Create profiles table
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT NOT NULL,
    caption TEXT,
    clothing_items JSONB DEFAULT '{}',
    is_full_brand BOOLEAN DEFAULT FALSE,
    full_brand_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create likes table
CREATE TABLE likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Enable Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Create policies for posts
CREATE POLICY "Users can view all posts" ON posts FOR SELECT USING (true);
CREATE POLICY "Users can create posts" ON posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON posts FOR DELETE USING (auth.uid() = user_id);

-- Create policies for likes
CREATE POLICY "Users can view all likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Users can create likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for outfit images
INSERT INTO storage.buckets (id, name, public) VALUES ('outfits', 'outfits', true);

-- Create storage policies
CREATE POLICY "Anyone can view outfit images" ON storage.objects FOR SELECT USING (bucket_id = 'outfits');
CREATE POLICY "Authenticated users can upload outfit images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'outfits' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own outfit images" ON storage.objects FOR UPDATE USING (bucket_id = 'outfits' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete own outfit images" ON storage.objects FOR DELETE USING (bucket_id = 'outfits' AND auth.uid()::text = (storage.foldername(name))[1]);




