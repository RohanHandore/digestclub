import TemplateItem from '@/components/digests/templates/TemplateItem';
import { TeamDigestsResult } from '@/lib/queries';
import { Team } from '@prisma/client';

const TeamTemplates = ({
  team,
  templates,
}: {
  team: Team;
  templates: TeamDigestsResult[];
}) => {
  if (!templates?.length) return null;

  return (
    <div className="pt-6">
      <div className="w-full border-t border-gray-300 pb-6" />
      <h3 className="text-lg font-semibold leading-7">Templates</h3>
      <span className="text-sm text-gray-500 font-light">
        Manage your team templates
      </span>
      <div className="flex gap-4 flex-col">
        {templates?.map((template) => (
          <TemplateItem key={template?.id} template={template} team={team} />
        ))}
      </div>
    </div>
  );
};

export default TeamTemplates;
