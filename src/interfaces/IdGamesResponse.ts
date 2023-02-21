export interface IdGamesResponseFile {
    age: number;
    author: string;
    description: string;
    dir: string;
    email: string;
    filename: string;
    id: number;
    idgamesurl: string;
    rating: number;
    size: number;
    title: string;
    url: string;
    votes: number;
}

export interface IdGamesResponse {
    content?: {
        file: IdGamesResponseFile[] | IdGamesResponseFile;
    }
    warning?: {
        type: string;
        message: string;
    }
    meta: {
        version: number;
    }
}