import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function CustomHeader({ toReturn, title }) {
  return (
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to={`/${toReturn}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center space-x-2 mb-1">
              <img
                src="/assets/icons/nuvana-icon.png"
                alt="Logo"
                style={{
                  objectFit: 'contain',
                  width: '30px',
                  height: '30px',
                }}
              />
            </div>
          </div>
          <Badge
            variant="secondary"
            className="bg-[#3377f5]/10 text-[#3377f5] border-[#3377f5]/20"
          >
            {title}
          </Badge>
        </div>
      </div>
    </header>
  );
}
