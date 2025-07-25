
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc, collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile, useAuth } from '@/hooks/use-auth';
import AppHeader from '@/components/AppHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MessageSquare, CheckCircle, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import UserAvatar from '@/components/UserAvatar';

interface Review {
    id: string;
    rating: number;
    comment: string;
    clientName: string;
    clientAvatar: string;
    createdAt: any;
}

const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <Star
                key={star}
                className={`h-5 w-5 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'
                    }`}
            />
        ))}
    </div>
);

export default function ProfilePage() {
    const params = useParams();
    const userId = params.userId as string;
    const { user: currentUser } = useAuth();
    const router = useRouter();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchProfile = async () => {
            const docRef = doc(db, "users", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                setProfile(docSnap.data() as UserProfile);
            } else {
                console.log('No such document!');
            }
            setLoading(false);
        };

        fetchProfile();
    }, [userId]);

    useEffect(() => {
        if (profile) {
            const fetchReviews = async () => {
                 if (profile.accountType !== 'tasker') {
                    setReviews([]);
                    return;
                }
                const q = query(
                    collection(db, 'reviews'),
                    where('taskerId', '==', userId),
                    orderBy('createdAt', 'desc')
                );
                const querySnapshot = await getDocs(q);
                
                const reviewsDataPromises = querySnapshot.docs.map(async (docSnap) => {
                    const reviewData = docSnap.data();
                    const clientProfileDoc = await getDoc(doc(db, 'users', reviewData.clientId));
                    const clientProfile = clientProfileDoc.data();
                    return { 
                        id: docSnap.id, 
                        ...reviewData,
                    } as Review;
                });
                
                const reviewsData = await Promise.all(reviewsDataPromises);
                setReviews(reviewsData);
            }
            fetchReviews();
        }
    }, [profile, userId])

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
                    <Skeleton className="h-32 w-32 rounded-full mx-auto" />
                    <Skeleton className="h-8 w-48 mx-auto mt-4" />
                    <Skeleton className="h-5 w-32 mx-auto mt-2" />
                    <div className="mt-8">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full mt-4" />
                        <Skeleton className="h-24 w-full mt-4" />
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="flex flex-col min-h-screen bg-background">
                <AppHeader />
                <div className="text-center py-20">User not found.</div>
            </div>
        );
    }
    
    const isOwner = currentUser?.uid === userId;

    return (
        <div className="flex flex-col min-h-screen bg-background">
            <AppHeader />
            <main className="flex-1">
                <div className="container mx-auto py-12 px-4 md:px-6 max-w-4xl">
                    <Card>
                        <CardContent className="p-8">
                           <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                             <UserAvatar 
                                name={profile.name}
                                imageUrl={profile.photoURL}
                                className="h-32 w-32 text-4xl"
                             />
                            <div className="text-center md:text-left flex-1">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center justify-center md:justify-start gap-2">
                                        <h1 className="text-3xl font-bold font-headline">{profile.name}</h1>
                                        {profile.isVerified && (
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger>
                                                        <CheckCircle className="h-7 w-7 text-primary" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p>Verified Tasker</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        )}
                                    </div>
                                    {isOwner && (
                                        <Button asChild variant="outline">
                                            <Link href="/profile-setup">
                                                <Edit className="mr-2 h-4 w-4"/>
                                                Edit Profile
                                            </Link>
                                        </Button>
                                    )}
                                </div>


                                <p className="text-muted-foreground mt-1 capitalize">{profile.accountType}</p>

                                {profile.accountType === 'tasker' && (
                                    <div className="flex items-center justify-center md:justify-start gap-2 mt-4">
                                        <StarRating rating={profile.averageRating || 0} />
                                        <span className="text-muted-foreground">({profile.reviewCount || 0} reviews)</span>
                                    </div>
                                )}

                                {profile.bio && (
                                    <p className="mt-4 text-muted-foreground max-w-prose">{profile.bio}</p>
                                )}
                            </div>
                           </div>
                        </CardContent>
                    </Card>

                    {profile.accountType === 'tasker' && profile.skills && profile.skills.length > 0 && (
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold font-headline mb-4">Skills</h2>
                            <Card>
                                <CardContent className="p-6">
                                    <div className="flex flex-wrap gap-2">
                                        {profile.skills.map(skill => (
                                            <Badge key={skill} variant="secondary" className="text-base">
                                                <CheckCircle className="mr-2 h-4 w-4 text-primary" />
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {profile.accountType === 'tasker' && (
                        <div className="mt-8">
                            <h2 className="text-2xl font-bold font-headline mb-4">Reviews</h2>
                            {reviews.length > 0 ? (
                                <div className="space-y-6">
                                    {reviews.map(review => (
                                        <Card key={review.id}>
                                            <CardContent className="p-6">
                                                <div className="flex items-start gap-4">
                                                    <UserAvatar 
                                                        name={review.clientName} 
                                                        imageUrl={review.clientAvatar} 
                                                    />
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-semibold">{review.clientName}</p>
                                                            <StarRating rating={review.rating} />
                                                        </div>
                                                        <p className="text-muted-foreground mt-2">{review.comment}</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <Card>
                                    <CardContent className="p-8 text-center text-muted-foreground">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-4" />
                                        This tasker has no reviews yet.
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
