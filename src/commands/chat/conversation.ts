
var conversations: any = {};

export function getConversation(channel: string, user: string): any {
    if (!conversations[channel]) {
        conversations[channel] = {};
    }
    return conversations[channel][user];
}

export function resetConversation(channel: string, user: string, conversation: any): void {
    conversations[channel][user] = conversation;
}