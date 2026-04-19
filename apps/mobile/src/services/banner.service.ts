import API_CLIENT from "@/lib/apiClient";

export interface Banner {
  id: string;
  title?: string;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export async function getBanners(): Promise<Banner[]> {
  try {
    const { data } = await API_CLIENT.get("/banners", {
      params: { isActive: true },
    });
    return (data.data || []) as Banner[];
  } catch (error) {
    console.error("[getBanners] Error fetching banners:", error);
    return [];
  }
}
