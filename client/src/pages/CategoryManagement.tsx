import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { trpc } from '../lib/trpc';
import { Button } from '../components/ui/button';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { CreateCategoryDialog } from '../components/categories/CreateCategoryDialog';
import { EditCategoryDialog } from '../components/categories/EditCategoryDialog';
import { DeleteCategoryDialog } from '../components/categories/DeleteCategoryDialog';

type Category = {
  id: number;
  name: string;
  type: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function SortableCategory({ category, onEdit, onDelete }: {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-card rounded-lg border"
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-medium text-foreground">{category.name}</h3>
          {category.color && (
            <div
              className="w-4 h-4 rounded-full border"
              style={{ backgroundColor: category.color }}
            />
          )}
          {!category.isActive && (
            <Badge variant="secondary">已停用</Badge>
          )}
        </div>
        {category.description && (
          <p className="text-sm text-muted-foreground truncate">
            {category.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1">
          類型：{category.type} • 排序：{category.sortOrder}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onEdit(category)}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onDelete(category)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function CategoryManagement() {
  const [includeDisabled, setIncludeDisabled] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Query categories
  const { data, isLoading, refetch } = trpc.videoCategories.list.useQuery(
    { includeDisabled }
  );

  // Update local state when data changes
  useEffect(() => {
    if (data) {
      setCategories(data);
    }
  }, [data]);

  // Reorder mutation
  const reorderMutation = trpc.videoCategories.reorder.useMutation({
    onSuccess: () => {
      toast.success('分類排序已更新');
      refetch();
    },
    onError: (error) => {
      toast.error(`排序失敗：${error.message}`);
      refetch(); // Revert to server state
    },
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Update sortOrder based on new positions
        const orders = newItems.map((item, index) => ({
          id: item.id,
          sortOrder: index + 1,
        }));

        // Send to server
        reorderMutation.mutate({ orders });

        return newItems;
      });
    }
  };

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setEditDialogOpen(true);
  };

  const handleDelete = (category: Category) => {
    setSelectedCategory(category);
    setDeleteDialogOpen(true);
  };

  const handleCreate = () => {
    setCreateDialogOpen(true);
  };

  const handleDialogSuccess = () => {
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">分類管理</h1>
            <p className="text-muted-foreground mt-1">
              管理影片分類、調整排序與設定
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            新增分類
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeDisabled}
              onChange={(e) => setIncludeDisabled(e.target.checked)}
              className="rounded"
            />
            顯示已停用的分類
          </label>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            載入中...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            尚無分類
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={categories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {categories.map((category) => (
                  <SortableCategory
                    key={category.id}
                    category={category}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <CreateCategoryDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={handleDialogSuccess}
        />

        <EditCategoryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          category={selectedCategory}
          onSuccess={handleDialogSuccess}
        />

        <DeleteCategoryDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          category={selectedCategory}
          onSuccess={handleDialogSuccess}
        />
      </div>
    </DashboardLayout>
  );
}
