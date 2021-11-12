import { Navigate } from 'react-router-dom';
import { Box, TableSortLabel, Typography } from '@mui/material';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { useUsers } from '../hooks/useUsers';
import { AdminAppBar } from '../components/AdminAppBar';
import { useEffect, useState } from 'react';
import { User } from '../api/basil-api';

const columns: { key: keyof User; title: string; sortable: boolean }[] = [
  {
    key: 'name',
    title: 'Name',
    sortable: true,
  },
  {
    key: 'surname',
    title: 'Surname',
    sortable: true,
  },
  {
    key: 'email',
    title: 'Email',
    sortable: true,
  },
  {
    key: 'role',
    title: 'Role',
    sortable: false,
  },
  {
    key: 'balance',
    title: 'Balance',
    sortable: true,
  },
];

export const Users = (props: { handleDrawerToggle: () => void }) => {
  const { users, error } = useUsers();
  const [sortedUsers, setSortedUsers] = useState<User[]>([]);
  const [sorting, setSorting] = useState<{
    by: keyof User;
    dir: 'asc' | 'desc';
  }>({ by: null, dir: 'asc' });

  useEffect(() => {
    if (users?.length) {
      const { by, dir } = sorting;
      if (by != null) {
        const mul = dir === 'asc' ? -1 : 1;
        const sorted = [...users].sort((a, b) => (a[by] < b[by] ? mul : -mul));
        console.log('Setting sorted users', sorted);
        setSortedUsers(sorted);
      } else {
        setSortedUsers(users);
      }
    }
  }, [users, sorting]);

  const toggleSorting = (byKey: keyof User) => () => {
    const { by, dir } = sorting;
    setSorting({
      by: by === byKey && dir === 'desc' ? null : byKey,
      dir: by == null ? 'asc' : dir === 'asc' ? 'desc' : 'asc',
    });
  };

  if ([401, 403].includes(error?.statusCode)) {
    return <Navigate to="/login" />;
  }
  return (
    <>
      <AdminAppBar handleDrawerToggle={props.handleDrawerToggle}>
        <Typography
          variant="h6"
          noWrap
          component="h1"
          color="primary.main"
          fontWeight="medium"
          sx={{ fontSize: { sm: 36 } }}
        >
          Users
        </Typography>
      </AdminAppBar>
      <Box
        sx={{ p: { xs: 2, sm: 3 }, pt: { sm: 0 }, flexGrow: 1, minHeight: 0 }}
      >
        <TableContainer
          component={Paper}
          sx={{ width: '100%', height: '100%' }}
        >
          <Table aria-label="Users table" stickyHeader>
            <TableHead>
              <TableRow>
                {columns.map(c => (
                  <TableCell
                    key={c.key}
                    sortDirection={sorting.by === c.key ? sorting.dir : false}
                  >
                    {c.sortable ? (
                      <TableSortLabel
                        active={sorting.by === c.key}
                        direction={sorting.by === c.key ? sorting.dir : 'asc'}
                        onClick={toggleSorting(c.key)}
                      >
                        {c.title}
                      </TableSortLabel>
                    ) : (
                      c.title
                    )}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedUsers?.map(user => (
                <TableRow
                  key={user.id}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <TableCell component="th" scope="row">
                    {user.name}
                  </TableCell>
                  <TableCell>{user.surname}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.role}</TableCell>
                  <TableCell>{user.balance}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </>
  );
};
