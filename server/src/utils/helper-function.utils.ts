export function faliureResponse(message: string) {
  return {
    success: false,
    message,
  };
}

export function successResponse(data: any) {
  return {
    success: true,
    data,
  };
}
