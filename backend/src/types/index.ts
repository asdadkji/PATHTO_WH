export interface JwtPayload {
    userId: number,
    role: 'student' | 'teacher' | 'admin';
}