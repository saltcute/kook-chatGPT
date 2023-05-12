import auth from "configs/auth";

export function isAdmin(id: string) {
    return (auth.adminList as string[]).includes(id);
}