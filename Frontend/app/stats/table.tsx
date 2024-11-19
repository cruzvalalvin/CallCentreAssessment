"use client";
import { Card } from "@/components/Card";
import { Table } from "@/components/Table";
import { useApiQuery } from "@/hooks/query";
import { Call } from "../calls/table";
import { use, useEffect, useState } from "react";
import { format } from "date-fns";

interface Stats {
    hour: number;
    callCount: number;
    topUser: string;
};

interface ListCallsResponse {
    items: Call[];
};

const filterCallsFrom9AMTo5PM = (calls: Call[]) => {
    return calls.filter((call) => {
        const callDate = new Date(call.dateCallStarted);
        const hour = callDate.getHours();
        return hour >= 9 && hour <= 17;
    });
};

const getTodayCalls = (calls: Call[]) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    return filterCallsFrom9AMTo5PM(calls).filter((call) => call.dateCallStarted.includes(today));
};

const calculateStatsPerHour = (calls: Call[]) => {
    const stats: { [key: number]: { callCount: number; userCalls: { [key: string]: number } } } = {};

    // Set initial values for each hour
    for (let hour = 9; hour <= 17; hour++) {
        stats[hour] = { callCount: 0, userCalls: {} };
    }

    // Stats Calculation
    calls.forEach(call => {
        const callDate = new Date(call.dateCallStarted);
        const hour = callDate.getHours();
        stats[hour].callCount++;
        if (stats[hour].userCalls[call.username]) {
            stats[hour].userCalls[call.username]++;
        } else {
            stats[hour].userCalls[call.username] = 1;
        }
    });

    // Get Top User for each hour
    const statsPerHour: Stats[] = Object.keys(stats).map(hour => {
        const hourStats = stats[parseInt(hour)];
        let topUser = '';
        let maxCalls = 0;
        for (const user in hourStats.userCalls) {
            if (hourStats.userCalls[user] > maxCalls) {
                maxCalls = hourStats.userCalls[user];
                topUser = user;
            }
        }
        return {
            hour: parseInt(hour),
            callCount: hourStats.callCount,
            topUser,
        };
    });

    // Rank the hours based on the number of calls by sorting hours by call count in descending order
    statsPerHour.sort((a, b) => b.callCount - a.callCount || a.hour - b.hour);

    return statsPerHour;
};

const formatHour = (hour: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:00 ${period}`;
};

const getMostCallsOccuredDate = (calls: Call[]) => {
    const dateCallCount: { [key: string]: number } = {};

    calls.forEach(call => {
        const date = call.dateCallStarted.split('T')[0];
        if (dateCallCount[date]) {
            dateCallCount[date]++;
        } else {
            dateCallCount[date] = 1;
        }
    });

    const mostCallsDate = Object.keys(dateCallCount).reduce((a, b) => dateCallCount[a] > dateCallCount[b] ? a : b);
    return format(new Date(mostCallsDate), 'dd/MM/yyyy');
}

const getAverageCallsPerDay = (calls: Call[]) => {
    const dates = calls.map((call) => call.dateCallStarted.split('T')[0]);
    const uniqueDates = [...new Set(dates)];
    return (calls.length / uniqueDates.length).toFixed(2).toString();
}

const getAverageCallsPerUser = (calls: Call[]) => {
    const users = calls.map((call) => call.username);
    const uniqueUsers = [...new Set(users)];
    return (calls.length / uniqueUsers.length).toFixed(2).toString();
}

const StatsTable = () => {
    const [statsPerHour, setStatsPerHour] = useState<Stats[]>([]);
    const [mostCallsOccuredDate, setMostCallsOccuredDate] = useState<string>('');
    const [averageCallsPerDay, setAverageCallsPerDay] = useState<string>('');
    const [averageCallsPerUser, setAverageCallsPerUser] = useState<string>('');
    const { data: callList, isLoading: isLoadingCallList } = useApiQuery<ListCallsResponse>("/Call/list");

    useEffect(() => {
        if (callList?.items) {
            const filteredCalls = filterCallsFrom9AMTo5PM(callList?.items);
            const todayCalls = getTodayCalls(filteredCalls);

            // Calculate Stats Per Hour
            const calculatedStatsPerHour = calculateStatsPerHour(todayCalls);
            setStatsPerHour(calculatedStatsPerHour);

            // Most Calls Occured Date
            setMostCallsOccuredDate(getMostCallsOccuredDate(filteredCalls));

            // Average Calls Per Day
            setAverageCallsPerDay(getAverageCallsPerDay(filteredCalls));

            // Average Calls Per User
            setAverageCallsPerUser(getAverageCallsPerUser(filteredCalls));
        }   
    }, [callList]);

    return (
        <div>
            <div className="flex mb-4">
                <div className="flex mr-4">
                    <Card>
                        <Card.Title>{!isLoadingCallList && mostCallsOccuredDate}</Card.Title>
                        <Card.Body>Most Calls Occured Date</Card.Body>
                    </Card>
                </div>
                <div className="flex mr-4">
                    <Card>
                        <Card.Title>{!isLoadingCallList && averageCallsPerDay}</Card.Title>
                        <Card.Body>Average Calls Per Day</Card.Body>
                    </Card>
                </div>
                <div className="flex mr-4">
                    <Card>
                        <Card.Title>{!isLoadingCallList && averageCallsPerUser}</Card.Title>
                        <Card.Body>Average Calls Per User</Card.Body>
                    </Card>
                </div>
            </div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-base font-semibold leading-6 text-white">
                        Stats
                    </h1>
                    <p className="mt-2 text-sm text-gray-300">
                        A list of calls made each hour of the working day, from 9 AM to 5 PM.
                    </p>
                </div>
                <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
                </div>
            </div>
            <Table.Container>
                {isLoadingCallList ? (
                    <Table.Loading />
                ) : (
                    <Table>
                    <Table.Header className="border border-gray-600">
                        <Table.HeaderCell className="p-3">Hour</Table.HeaderCell>
                        <Table.HeaderCell className="p-3">Call Count</Table.HeaderCell>
                        <Table.HeaderCell className="p-3">Top User</Table.HeaderCell>
                    </Table.Header>
                    <Table.Body>
                        {statsPerHour.map((stat) => (
                            <Table.Row key={stat.hour}>
                                <Table.Cell className="p-3 text-center">{formatHour(stat.hour)}</Table.Cell>
                                <Table.Cell className="p-3 text-center">{stat.callCount}</Table.Cell>
                                <Table.Cell className="p-3 text-center">{stat.topUser}</Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
                )}
            </Table.Container>
        </div>
    );
};

export default StatsTable;