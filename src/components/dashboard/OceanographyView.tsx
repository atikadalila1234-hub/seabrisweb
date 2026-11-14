import React from 'react';
import { MuaraAngkeOceanographyDashboard } from './MuaraAngkeOceanographyDashboard';
import { AuthUser, User } from '../../types';

export interface OceanographyViewProps {
  onNavigateToDevice?: () => void;
  onNavigateToMap?: () => void;
  isPublicView?: boolean;
  currentUser?: AuthUser | User | null;
  onOpenLogin?: () => void;
}

export const OceanographyView: React.FC<OceanographyViewProps> = (props) => {
  return <MuaraAngkeOceanographyDashboard {...props} />;
};

export default OceanographyView;
