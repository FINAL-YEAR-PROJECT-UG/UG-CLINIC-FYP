import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { studentId, name, email, date, time, reason } = body;

    // Validate required fields
    if (!studentId || !name || !email || !date || !time || !reason) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Here you would typically:
    // 1. Validate the data
    // 2. Call your backend API to create the appointment
    // 3. Return the response

    // For demo purposes, we'll just return a success response
    // In production, you would call your backend API like:
    // const response = await fetch('http://localhost:3001/api/appointments', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ studentId, name, email, date, time, reason }),
    // });
    // const data = await response.json();

    console.log('Appointment booking request:', {
      studentId,
      name,
      email,
      date,
      time,
      reason,
    });

    return NextResponse.json(
      { 
        message: 'Appointment booked successfully',
        appointment: {
          id: Date.now(),
          studentId,
          name,
          email,
          date,
          time,
          reason,
          status: 'PENDING',
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error booking appointment:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
