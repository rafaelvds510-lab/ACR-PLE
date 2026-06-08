'use client';
import dynamic from 'next/dynamic';

export default dynamic(() => import('./XMindEditor'), { ssr: false });
