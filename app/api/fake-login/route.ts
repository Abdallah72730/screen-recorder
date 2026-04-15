import {cookies} from 'next/headers';
import {NextResponse} from 'next/server';


export async function POST(request: Request) {
    const {username} = await request.json();
    
    //In a real app, you would validate creadentials here
    //For this application, we just accept any username
    const cookieStore = await cookies();
    cookieStore.set('user', username, {
        httpOnly: true,
        maxAge: 60 * 60 * 24
    });
    
    return NextResponse.json({success: true});
}

export async function DELETE(){
    const cookieStore = await cookies();
    cookieStore.delete('user');
    return NextResponse.json({success: true});
}