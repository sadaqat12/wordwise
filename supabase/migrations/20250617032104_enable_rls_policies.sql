-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagement_events ENABLE ROW LEVEL SECURITY;

-- Users table policies
-- Users can read and update their own records
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Workspaces table policies  
-- Users can only access workspaces they own
CREATE POLICY "Users can view own workspaces" ON workspaces
    FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own workspaces" ON workspaces
    FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own workspaces" ON workspaces
    FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own workspaces" ON workspaces
    FOR DELETE USING (auth.uid() = owner_id);

-- Documents table policies
-- Users can access documents in workspaces they own
CREATE POLICY "Users can view documents in own workspaces" ON documents
    FOR SELECT USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert documents in own workspaces" ON documents
    FOR INSERT WITH CHECK (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update documents in own workspaces" ON documents
    FOR UPDATE USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete documents in own workspaces" ON documents
    FOR DELETE USING (
        workspace_id IN (
            SELECT id FROM workspaces WHERE owner_id = auth.uid()
        )
    );

-- Suggestions table policies
-- Users can access suggestions for documents they have access to
CREATE POLICY "Users can view suggestions for accessible documents" ON suggestions
    FOR SELECT USING (
        doc_id IN (
            SELECT d.id FROM documents d
            JOIN workspaces w ON d.workspace_id = w.id
            WHERE w.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert suggestions for accessible documents" ON suggestions
    FOR INSERT WITH CHECK (
        doc_id IN (
            SELECT d.id FROM documents d
            JOIN workspaces w ON d.workspace_id = w.id
            WHERE w.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update suggestions for accessible documents" ON suggestions
    FOR UPDATE USING (
        doc_id IN (
            SELECT d.id FROM documents d
            JOIN workspaces w ON d.workspace_id = w.id
            WHERE w.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete suggestions for accessible documents" ON suggestions
    FOR DELETE USING (
        doc_id IN (
            SELECT d.id FROM documents d
            JOIN workspaces w ON d.workspace_id = w.id
            WHERE w.owner_id = auth.uid()
        )
    );

-- Engagement events table policies
-- Users can access events for documents they have access to
CREATE POLICY "Users can view events for accessible documents" ON engagement_events
    FOR SELECT USING (
        doc_id IN (
            SELECT d.id FROM documents d
            JOIN workspaces w ON d.workspace_id = w.id
            WHERE w.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert events for accessible documents" ON engagement_events
    FOR INSERT WITH CHECK (
        doc_id IN (
            SELECT d.id FROM documents d
            JOIN workspaces w ON d.workspace_id = w.id
            WHERE w.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can update events for accessible documents" ON engagement_events
    FOR UPDATE USING (
        doc_id IN (
            SELECT d.id FROM documents d
            JOIN workspaces w ON d.workspace_id = w.id
            WHERE w.owner_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete events for accessible documents" ON engagement_events
    FOR DELETE USING (
        doc_id IN (
            SELECT d.id FROM documents d
            JOIN workspaces w ON d.workspace_id = w.id
            WHERE w.owner_id = auth.uid()
        )
    );
