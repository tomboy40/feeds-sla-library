export const getPaginationParams = (page: number, pageSize: number) => ({
  limit: pageSize,
  offset: (page - 1) * pageSize
});

export const validateSortColumn = (column: string | null, allowedColumns: string[]) => {
  return allowedColumns.includes(column || '') ? column : 'id';
};
