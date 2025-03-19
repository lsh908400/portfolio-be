export interface FolderConfig {
    id: string;
    path: string;
    password?: string; // 암호화된 비밀번호
    maxSizeBytes?: number; // 최대 용량 (바이트 단위)
    createdAt: Date;
} 