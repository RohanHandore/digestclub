'use client';

import { useRouter } from 'next/navigation';
import { routes } from '@/core/constants';
import useCustomToast from '@/hooks/useCustomToast';
import useTransitionRefresh from '@/hooks/useTransitionRefresh';
import api from '@/lib/api';

import useAddAndRemoveBlockOnDigest from '@/hooks/useAddAndRemoveBlockOnDigest';
import { getDigest, getTeamBySlug } from '@/lib/queries';
import { ApiDigestResponseSuccess } from '@/pages/api/teams/[teamId]/digests';
import { reorderList } from '@/utils/actionOnList';
import { TrashIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { DigestBlock, DigestBlockType } from '@prisma/client';
import { AxiosError, AxiosResponse } from 'axios';
import clsx from 'clsx';
import { useState } from 'react';
import {
  DragDropContext,
  DropResult,
  resetServerContext,
} from 'react-beautiful-dnd';
import { useForm } from 'react-hook-form';
import { useMutation } from 'react-query';
import Button from '../../Button';
import { Input } from '../../Input';
import { DeletePopover } from '../../Popover';
import { BlockListDnd } from '../../digests/BlockListDnd';
import SectionContainer from '../../layout/SectionContainer';
import { Breadcrumb } from '../../teams/Breadcrumb';
import { formatTemplateTitle } from '../../digests/templates/TemplateItem';

type Props = {
  template: NonNullable<Awaited<ReturnType<typeof getDigest>>>;
  team: Awaited<ReturnType<typeof getTeamBySlug>>;
};

type DigestData = {
  title?: string;
  description?: string;
  publishedAt?: Date | null;
  digestBlocks?: DigestBlock[];
};

export const TemplateEdit = ({ template, team }: Props) => {
  const { push } = useRouter();
  const { successToast, errorToast } = useCustomToast();
  const [isMoving, setIsMoving] = useState(false);

  resetServerContext();

  const {
    register,
    handleSubmit,
    formState: { isDirty },
    reset,
  } = useForm({
    defaultValues: {
      title: formatTemplateTitle(template?.title, team.slug),
      description: template?.description,
    },
  });

  const { add, order } = useAddAndRemoveBlockOnDigest({
    teamId: team.id,
    digestId: template.id,
  });

  const { refresh, isRefreshing } = useTransitionRefresh();
  const { refresh: saveRefresh } = useTransitionRefresh();

  const onDragEnd = async (result: DropResult) => {
    if (!result.destination || result.destination.droppableId === 'bookmark') {
      return;
    }

    setIsMoving(true);

    if (result.source.droppableId === 'bookmark') {
      await add.mutateAsync({
        bookmarkId: result.draggableId,
        position: result.destination.index,
        type: DigestBlockType.BOOKMARK,
      });
    } else {
      template.digestBlocks = reorderList(
        template.digestBlocks,
        result.source.index,
        result.destination.index
      );

      await order.mutateAsync({
        blockId: result.draggableId,
        position: result.destination.index,
      });
    }

    setIsMoving(false);
  };

  const { mutate: mutateSave, isLoading: isSaving } = useMutation<
    DigestData,
    AxiosError<ErrorResponse>,
    DigestData
  >(
    ['patch-digest-save', team.id, template?.id],
    (data: DigestData) => {
      return api.patch(`/teams/${team.id}/digests/${template?.id}`, {
        ...{ ...data, title: `${team.slug}-template-${data?.title}` },
      });
    },
    {
      onSuccess: (template: DigestData) => {
        reset({ title: template?.title });
        successToast('Your template has been updated');
        saveRefresh();
      },
      onError: (error: AxiosError<ErrorResponse>) => {
        errorToast(
          error.response?.data?.error ||
            error.response?.statusText ||
            error.message
        );
      },
    }
  );

  const { mutate: deleteDigest, isLoading: isDeleting } = useMutation<
    AxiosResponse<ApiDigestResponseSuccess>,
    AxiosError<ErrorResponse>
  >(
    'delete-digest',
    () => {
      return api.delete(`/teams/${team.id}/digests/${template.id}`);
    },
    {
      onSuccess: () => {
        successToast('Template has been deleted');
        refresh();
        push(routes.TEAM.replace(':slug', team.slug));
      },
      onError: (error) => {
        errorToast(
          error.response?.data?.error ||
            error.response?.statusText ||
            error.message
        );
      },
    }
  );

  const onBlur = (data: any) => {
    if (!isDirty) return;
    mutateSave(data);
  };

  return (
    <div className="pb-4">
      <Breadcrumb
        paths={[
          {
            name: team.name,
            href: routes.TEAM.replace(':slug', team.slug),
          },
          {
            name: 'Template edition',
          },
        ]}
      />
      <div className="flex flex-col gap-5 items-stretch justify-start md:flex-row">
        <DragDropContext onDragEnd={onDragEnd}>
          <SectionContainer className={clsx(' w-full h-min')}>
            <form className="flex flex-col gap-5" onBlur={handleSubmit(onBlur)}>
              <div className="flex justify-between">
                <div className="flex justify-between">
                  <InformationCircleIcon className="w-6 h-6 mr-2" />
                  <span className="italic">
                    Editing this template will not affect already created
                    digests
                  </span>
                </div>
                <DeletePopover
                  handleDelete={deleteDigest}
                  isLoading={isDeleting}
                  trigger={
                    <Button
                      aria-label="Delete template"
                      icon={<TrashIcon />}
                      variant="destructiveGhost"
                      isLoading={isDeleting || isRefreshing}
                    >
                      Delete template
                    </Button>
                  }
                />
              </div>

              <div className="w-full items-start flex flex-col gap-6">
                <Input
                  placeholder="Add a title"
                  {...register('title')}
                  className="!text-3xl !font-bold px-4 !py-4"
                />
              </div>
              <div
                className={clsx(
                  'flex flex-col w-full',
                  (isMoving ||
                    isRefreshing ||
                    add.isLoading ||
                    order.isLoading) &&
                    'pointer-events-none cursor-not-allowed opacity-60'
                )}
              >
                <BlockListDnd digest={template} team={team} />
              </div>
            </form>
          </SectionContainer>
        </DragDropContext>
      </div>
    </div>
  );
};
