import { NextResponse } from 'next/server';
import { getCategoriesAction } from '../../../action/productActions';

export async function GET() {
  const data = await getCategoriesAction();
  return NextResponse.json(data);
}