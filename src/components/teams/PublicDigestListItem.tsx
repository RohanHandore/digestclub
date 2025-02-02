import { DiscoveryDigest } from '@/lib/queries';
import { formatDate } from '@/utils/date';
import { generateDigestOGUrl } from '@/utils/open-graph-url';
import { Team } from '@prisma/client';
import Link from 'next/link';
import BookmarkImage from '../bookmark/BookmarkImage';
import BookmarkCountBadge from './BookmarkCountBadge';
import TeamAvatar from './TeamAvatar';

interface Props {
  digest: DiscoveryDigest;
  showTeam?: boolean;
  team: Partial<Team>;
}

const PublicDigestListItem = ({ digest, showTeam, team }: Props) => {
  const { title, description, publishedAt, digestBlocks } = digest;
  const url = new URL(generateDigestOGUrl(digest.slug));

  return (
    <Link
      href={`/${team.slug}/${digest.slug}`}
      className="overflow-hidden flex cursor-pointer"
      rel="noopener noreferrer"
    >
      <article className="flex flex-col items-start w-full bg-white py-6 px-6 border border-gray-200 rounded-md">
        {showTeam && (
          <div className="flex items-center gap-x-1 text-xs">
            <Link href={`/${team.slug}`}>
              <div className="flex items-center justify-center gap-2">
                <TeamAvatar team={team} />
                <span>{team?.name}</span>
              </div>
            </Link>
          </div>
        )}
        <div className="flex justify-between items-center w-full">
          <h3 className="mt-1 text-lg font-semibold leading-6 text-gray-900 group-hover:text-gray-600">
            <span className="text-2xl font-bold">{title}</span>
          </h3>
          <time className="text-gray-500 text-xs">
            {formatDate(publishedAt!, 'MMMM dd, yyyy')}
          </time>
        </div>
        <p className="mt-2 line-clamp-3 text-sm leading-6 text-gray-600">
          {description}
        </p>
        <div className="mt-4">
          {digestBlocks && <BookmarkCountBadge count={digestBlocks.length} />}
        </div>
        <div className="flex mt-2 overflow-hidden items-center gap-2">
          {digest.digestBlocks.slice(0, 5).map((bookmark) => (
            <div
              key={bookmark.id}
              className="h-24 w-36 relative border border-gray-200 rounded-sm overflow-hidden"
            >
              <BookmarkImage link={bookmark.bookmark!.link} />
            </div>
          ))}
        </div>
      </article>
    </Link>
  );
};

export default PublicDigestListItem;
