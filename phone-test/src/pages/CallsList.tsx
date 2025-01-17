import { useQuery } from '@apollo/client';
import styled from 'styled-components';
import { PAGINATED_CALLS } from '../gql/queries';
import {
  Grid,
  Icon,
  Typography,
  Spacer,
  Box,
  DiagonalDownOutlined,
  DiagonalUpOutlined,
  Pagination
} from '@aircall/tractor';
import { formatDate, formatDuration } from '../helpers/dates';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';

export const PaginationWrapper = styled.div`
  > div {
    width: inherit;
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
`;

type DateGroup = {
  [date: string]: Call[];
};

export const CallsListPage = () => {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const [callsPerPage, setCallsPerPage] = useState(25);
  const [filterCallType, setFilterCallType] = useState('');
  const [filterDirection, setFilterDirection] = useState('');
  const pageQueryParams = search.get('page');
  const activePage = !!pageQueryParams ? parseInt(pageQueryParams) : 1;
  const { loading, error, data } = useQuery(PAGINATED_CALLS, {
    variables: {
      offset: (activePage - 1) * callsPerPage,
      limit: callsPerPage
    }
    // onCompleted: () => handleRefreshToken(),
  });

  if (loading) return <p>Loading calls...</p>;
  if (error) return <p>ERROR</p>;
  if (!data) return <p>Not found</p>;

  const { totalCount, nodes: calls } = data.paginatedCalls;

  const handleCallOnClick = (callId: string) => {
    navigate(`/calls/${callId}`);
  };

  const handlePageChange = (page: number) => {
    navigate(`/calls/?page=${page}`);
  };

  const filteredCalls = calls
    .filter((call: Call) => call.call_type === filterCallType || filterCallType === '')
    .filter((call: Call) => call.direction === filterDirection || filterDirection === '');

  const groupByDate = (calls: Call[]): DateGroup => {
    return calls.reduce((acc: any, call: Call) => {
      const date = formatDate(call.created_at).substring(0, 6);
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(call);
      return acc;
    }, {});
  };

  return (
    <>
      <Typography variant="displayM" textAlign="center" py={3}>
        Calls History
      </Typography>
      <label htmlFor="filter-call-type">Filter by Call Type </label>
      <select
        id="filter-call-type"
        name="filter-call-type"
        value={filterCallType}
        onChange={e => setFilterCallType(e.target.value)}
      >
        <option value="">All</option>
        <option value="answered">Answered</option>
        <option value="missed">Missed</option>
        <option value="voicemail">Voicemail</option>
      </select>
      <label htmlFor="filter-call-type">Filter by Direction </label>
      <select
        id="filter-direction"
        name="filter-direction"
        value={filterDirection}
        onChange={e => setFilterDirection(e.target.value)}
      >
        <option value="">All</option>
        <option value="inbound">Inbound</option>
        <option value="outbound">Outbound</option>
      </select>
      <Spacer space={3} direction="vertical">
        {Object.entries(groupByDate(filteredCalls)).map(([date, calls]) => {
          return (
            <Box key={date}>
              <Typography variant="displayS">{date}</Typography>
              {calls.map((call: Call) => {
                const icon =
                  call.direction === 'inbound' ? DiagonalDownOutlined : DiagonalUpOutlined;
                const title =
                  call.call_type === 'missed'
                    ? 'Missed call'
                    : call.call_type === 'answered'
                    ? 'Call answered'
                    : 'Voicemail';
                const subtitle =
                  call.direction === 'inbound' ? `from ${call.from}` : `to ${call.to}`;
                const duration = formatDuration(call.duration / 1000);
                const date = formatDate(call.created_at);
                const notes = call.notes ? `Call has ${call.notes.length} notes` : <></>;

                return (
                  <Box
                    key={call.id}
                    bg="black-a30"
                    borderRadius={16}
                    cursor="pointer"
                    onClick={() => handleCallOnClick(call.id)}
                  >
                    <Grid
                      gridTemplateColumns="32px 1fr max-content"
                      columnGap={2}
                      borderBottom="1px solid"
                      borderBottomColor="neutral-700"
                      alignItems="center"
                      px={4}
                      py={2}
                    >
                      <Box>
                        <Icon component={icon} size={32} />
                      </Box>
                      <Box>
                        <Typography variant="body">{title}</Typography>
                        <Typography variant="body2">{subtitle}</Typography>
                      </Box>
                      <Box>
                        <Typography variant="caption" textAlign="right">
                          {duration}
                        </Typography>
                        <Typography variant="caption">{date}</Typography>
                      </Box>
                    </Grid>
                    <Box px={4} py={2}>
                      <Typography variant="caption">{notes}</Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          );
        })}
      </Spacer>

      {totalCount && (
        <PaginationWrapper>
          <Pagination
            activePage={activePage}
            pageSize={callsPerPage}
            onPageChange={handlePageChange}
            recordsTotalCount={totalCount}
            onPageSizeChange={(pageSize: number) => setCallsPerPage(pageSize)}
          />
        </PaginationWrapper>
      )}
    </>
  );
};
