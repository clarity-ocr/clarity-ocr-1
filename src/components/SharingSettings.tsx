import { useState, useEffect } from 'react';
import { 
  Share2, 
  Copy, 
  Lock, 
  Unlock, 
  Calendar, 
  Eye, 
  EyeOff,
  Globe,
  Users,
  BarChart3,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { HistoryItem } from '@/types/history'; // Ensure this matches your actual type definition
import { toast } from 'sonner';

// Define the shape of HistoryItem based on your actual data structure
interface EnhancedHistoryItem extends HistoryItem {
  id: string;
  fileName: string;
  isPublic?: boolean;
  password?: string;
  expiresAt?: string;
  shareCount?: number;
  lastSharedAt?: Date;
}

interface SharingSettingsProps {
  historyItem: EnhancedHistoryItem;
  onClose: () => void;
}

export const SharingSettings = ({ historyItem, onClose }: SharingSettingsProps) => {
  // Initialize state with safe defaults
  const [isPublic, setIsPublic] = useState(!!historyItem.isPublic);
  const [password, setPassword] = useState(historyItem.password || '');
  const [expiresAt, setExpiresAt] = useState(historyItem.expiresAt || '');
  const [customMessage, setCustomMessage] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Generate shareable link (implement based on your routing)
  const shareableLink = `https://your-domain.com/share/${historyItem.id}`;
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableLink);
      setIsCopied(true);
      toast.success('Link copied to clipboard');
      
      setTimeout(() => setIsCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // Implement your API call here
      // await updateSharingSettings(historyItem.id, { ... });
      toast.success('Sharing settings updated');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleShareOnWhatsApp = () => {
    const message = customMessage || 
      `Check out this task list: ${historyItem.fileName}\n\n${shareableLink}`;
    
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };
  
  const handleShareOnTwitter = () => {
    const text = customMessage || 
      `Check out this task list: ${historyItem.fileName}`;
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(shareableLink);
    
    window.open(`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`, '_blank');
  };
  
  const handleShareOnLinkedIn = () => {
    const title = encodeURIComponent(`Task List: ${historyItem.fileName}`);
    const summary = encodeURIComponent(customMessage || 'Check out this task list');
    const url = encodeURIComponent(shareableLink);
    
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}&title=${title}&summary=${summary}`, '_blank');
  };
  
  const handleShareByEmail = () => {
    const subject = encodeURIComponent(`Task List: ${historyItem.fileName}`);
    const body = encodeURIComponent(
      `Check out this task list: ${historyItem.fileName}\n\n${shareableLink}\n\n${customMessage}`
    );
    
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Sharing Settings</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="space-y-6">
            {/* Shareable Link */}
            <div>
              <Label className="text-sm font-medium">Shareable Link</Label>
              <div className="flex mt-1">
                <Input 
                  value={shareableLink} 
                  readOnly 
                  className="rounded-r-none" 
                />
                <Button 
                  onClick={handleCopyLink}
                  className="rounded-l-none"
                >
                  {isCopied ? 'Copied!' : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>
            
            {/* Privacy Settings */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                Privacy Settings
              </Label>
              <div className="mt-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={isPublic} 
                      onCheckedChange={setIsPublic} 
                    />
                    <span>Make this list public</span>
                  </div>
                  {isPublic ? (
                    <Badge variant="outline" className="bg-green-50 text-green-800 border-green-200">
                      <Globe className="w-3 h-3 mr-1" />
                      Public
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
                
                {!isPublic && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password (optional)</Label>
                    <Input 
                      id="password"
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a password to protect this list"
                    />
                  </div>
                )}
              </div>
            </div>
            
            {/* Expiration Settings */}
            <div>
              <Label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Expiration Settings
              </Label>
              <div className="mt-2 space-y-2">
                <Label htmlFor="expiresAt">Expires at (optional)</Label>
                <Input 
                  id="expiresAt"
                  type="datetime-local" 
                  value={expiresAt} 
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave empty to make this link permanent
                </p>
              </div>
            </div>
            
            {/* Custom Message */}
            <div>
              <Label className="text-sm font-medium">Custom Message</Label>
              <Textarea 
                value={customMessage} 
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a custom message to include when sharing"
                className="mt-1"
              />
            </div>
            
            {/* Sharing Stats */}
            <div className="bg-muted/50 p-4 rounded-lg">
              <h3 className="font-medium flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4" />
                Sharing Statistics
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Times shared</p>
                  <p className="font-medium">{historyItem.shareCount || 0}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Last shared</p>
                  <p className="font-medium">
                    {historyItem.lastSharedAt 
                      ? new Date(historyItem.lastSharedAt).toLocaleDateString() 
                      : 'Never'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={handleSaveSettings} 
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? 'Saving...' : 'Save Settings'}
              </Button>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShareOnWhatsApp}
                  className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
                >
                  WhatsApp
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShareOnTwitter}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  Twitter
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShareOnLinkedIn}
                  className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                >
                  LinkedIn
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleShareByEmail}
                >
                  Email
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};