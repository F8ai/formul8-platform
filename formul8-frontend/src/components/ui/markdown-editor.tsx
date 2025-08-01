import { useState } from 'react';
import { Button } from './button';
import { Textarea } from './textarea';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Eye, Edit, Save, X } from 'lucide-react';

interface MarkdownEditorProps {
  content: string;
  onSave: (content: string) => void;
  title?: string;
  editable?: boolean;
}

export function MarkdownEditor({ content, onSave, title = "Markdown Editor", editable = true }: MarkdownEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [isPreview, setIsPreview] = useState(true);

  const handleSave = () => {
    onSave(editContent);
    setIsEditing(false);
    setIsPreview(true);
  };

  const handleCancel = () => {
    setEditContent(content);
    setIsEditing(false);
    setIsPreview(true);
  };

  // Simple markdown to HTML conversion for preview
  const renderMarkdown = (text: string) => {
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/\n/g, '<br>')
      .replace(/^/, '<p class="mb-2">')
      .replace(/$/, '</p>');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant="outline" className="text-xs">
              {content.split('\n').length} lines
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {!isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPreview(!isPreview)}
                >
                  {isPreview ? <Edit className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  {isPreview ? 'Raw' : 'Preview'}
                </Button>
                {editable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </>
            )}
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Enter markdown content..."
            />
            <div className="text-xs text-gray-500">
              Supports: # Headers, ## Subheaders, **bold**, - bullet points
            </div>
          </div>
        ) : isPreview ? (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ 
              __html: renderMarkdown(content) 
            }}
          />
        ) : (
          <pre className="text-sm bg-gray-50 p-4 rounded-lg overflow-auto max-h-[400px] whitespace-pre-wrap">
            {content}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}