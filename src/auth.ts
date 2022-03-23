import { Auth } from '@aws-amplify/auth';
import { Amplify } from '@aws-amplify/core';
import { ICognitoUserPoolData } from 'amazon-cognito-identity-js';
import log from 'loglevel';

export interface User {
    attributes: Record<string, string>;
    id?: string;
    username: string;
    signOut: () => void;
}

export function configureAmplify(poolData: ICognitoUserPoolData) {
    Amplify.configure({
        Auth: {
            userPoolId: poolData.UserPoolId,
            userPoolWebClientId: poolData.ClientId,
        },
    });
}

export async function getUser(bypassCache = false) {
    return Auth.currentAuthenticatedUser({ bypassCache }).catch(() => undefined);
}

export async function login(username: string, password: string, onLogin?: (user: User) => void) {
    const user = await Auth.signIn(username, password);
    if (!user) {
        const error = new Error('Auth failed');
        throw error;
    }
    if (!user.challengeName && onLogin) {
        onLogin(user);
    }
    log.info({ message: 'User login ' + (user ? 'success' : 'fail') }, await getToken());
    return user;
}

export async function getToken(): Promise<string> {
    const session = await Auth.currentSession().catch(() => undefined);
    return session?.getIdToken()?.getJwtToken() || '';
}

export async function isAuthenticated(): Promise<boolean> {
    const user = await getUser();
    return !!user;
}