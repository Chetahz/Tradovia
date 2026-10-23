'use client';

import Image from 'next/image';
import { useState } from 'react';
import type { WorkspaceData } from '@/lib/domain';

export default function ProfileAvatar({ profile, mode, large = false, small = false }: {
  profile: WorkspaceData['profile'];
  mode: string;
  large?: boolean;
  small?: boolean;
}) {
  const [failedVersion, setFailedVersion] = useState('');
  const version = profile.avatarVersion;
  const showImage = Boolean(version && version !== failedVersion);
  return <span className={`avatar${large ? ' avatar-large' : ''}${small ? ' small' : ''}`} aria-hidden="true">
    {showImage ? <Image
      src={`/api/profile/avatar?mode=${mode}&v=${version}`}
      width={large ? 64 : 36}
      height={large ? 64 : 36}
      unoptimized
      alt=""
      onError={() => setFailedVersion(version!)}
    /> : profile.name.trim().slice(0, 1).toUpperCase()}
  </span>;
}
