import { MouseEvent, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';
import { useFormik } from 'formik';
import { Save } from '@mui/icons-material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Paper,
  Typography,
} from '@mui/material';
import Avatar from '@mui/material/Avatar';
import { User } from '../api/BasilApi';
import { AdminAppBar } from '../components/AdminAppBar';
import { usePendingState } from '../hooks/usePendingState';
import { useTransaction } from '../hooks/useTransaction';
import { useUser } from '../hooks/useUser';
import { Balance } from './Balance';

export const AdminUser = (props: { handleDrawerToggle: () => void }) => {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const id = idParam === 'new' ? null : +idParam;
  const { user, upsertUser, load } = useUser(id);
  const [open, setOpen] = useState(false);
  const [show, setShow] = useState(false);
  const { upsertTransaction } = useTransaction();
  const { pending, setPending } = usePendingState();
  const form = useFormik({
    initialValues: {
      name: '',
      surname: '',
      email: '',
      password: '',
      avatar: '',
      location: null,
    } as Partial<User>,
    onSubmit: (values: Partial<User>, { setErrors }) => {
      // TODO return upsertUser update or create
    },
  });

  useEffect(() => {
    if (user) {
      form.setValues(user);
      form.values.password = '';
    }
  }, [user]);

  const handleClickShowPassword = () => {
    setShow(!show);
  };

  const handleMouseDownPassword = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
  };

  const change = (add: boolean, amount: number) => {
    if (amount > 0) {
      amount = add ? amount : -amount;
      upsertTransaction({
        user: { id: user.id } as User,
        amount,
      })
        .then(() => {
          load();
          toast.success(`Wallet updated`);
          navigate(`/admin/users/${user?.id}`);
          setOpen(false);
        })
        .catch(() => {
          //noop
        });
    } else {
      toast.error(`Amount should be a positive and not null number`);
    }
  };

  return (
    <>
      <AdminAppBar handleDrawerToggle={props.handleDrawerToggle}>
        <Balance open={open} setOpen={setOpen} user={user} change={change} />
        <Typography
          variant="h6"
          noWrap
          component="h1"
          color="primary.main"
          fontWeight="bold"
          sx={{ fontSize: { sm: 28 }, mr: 'auto' }}
        >
          Users / {user ? `${user.name} ${user.surname}` : 'New'}
        </Typography>
        <Button
          type="submit"
          sx={{ minWidth: 0, px: { xs: 1, sm: 2 } }}
          variant="contained"
          onClick={form.submitForm}
          disabled={user != null}
        >
          <Save />
          <Typography
            sx={{
              display: { xs: 'none', sm: 'inline' },
              textTransform: 'none',
            }}
          >
            Save changes
          </Typography>
        </Button>
      </AdminAppBar>
      <Box
        sx={{ p: { xs: 2, sm: 3 }, pt: { sm: 0 }, flexGrow: 1, minHeight: 0 }}
      >
        <Paper
          className="AdminUser"
          sx={{ p: { xs: 2, sm: 3 }, py: { sm: 4 }, position: 'relative' }}
        >
          <div className="container relative">
            <Avatar
              src={(user as User)?.avatar}
              alt="profile avatar"
              style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                objectFit: 'cover',
                marginBottom: '40px',
              }}
            />
            <Grid
              container
              direction="row"
              columnSpacing={4}
              rowSpacing={2}
              gridTemplateColumns="repeat(auto-fill, minmax(20rem, 1fr))"
            >
              <Grid item xs={12} sm={6} md={4}>
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!form.errors?.name}
                  disabled={pending}
                >
                  <InputLabel htmlFor="name">Name</InputLabel>
                  <OutlinedInput
                    id="name"
                    type="text"
                    onChange={form.handleChange}
                    value={form.values.name}
                    label="Name"
                    name="name"
                  />
                  <FormHelperText>{form.errors?.name}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!form.errors?.surname}
                  disabled={pending}
                >
                  <InputLabel htmlFor="surname">Surname</InputLabel>
                  <OutlinedInput
                    id="surname"
                    type="text"
                    onChange={form.handleChange}
                    value={form.values.surname}
                    label="Surname"
                    name="surname"
                  />
                  <FormHelperText>{form.errors?.surname}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!form.errors?.email}
                  disabled={pending}
                >
                  <InputLabel htmlFor="email">Email</InputLabel>
                  <OutlinedInput
                    id="email"
                    type="email"
                    onChange={form.handleChange}
                    value={form.values.email}
                    label="Email"
                    name="email"
                  />
                  <FormHelperText>{form.errors?.email}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!form.errors?.password}
                  disabled={pending}
                >
                  <InputLabel htmlFor="password">Password</InputLabel>
                  <OutlinedInput
                    id="password"
                    type={show ? 'text' : 'password'}
                    onChange={form.handleChange}
                    value={form.values.password}
                    label="Password"
                    name="password"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                        >
                          {show ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  <FormHelperText>{form.errors?.password}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!form.errors?.avatar}
                  disabled={pending}
                >
                  <InputLabel htmlFor="avatar">Avatar</InputLabel>
                  <OutlinedInput
                    id="avatar"
                    type="text"
                    onChange={form.handleChange}
                    value={form.values.avatar}
                    label="Avatar"
                    name="avatr"
                  />
                  <FormHelperText>{form.errors?.avatar}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl
                  variant="outlined"
                  fullWidth
                  error={!!form.errors?.balance}
                  disabled={pending}
                >
                  <InputLabel htmlFor="balance">Balance</InputLabel>
                  <OutlinedInput
                    disabled
                    label="Balance"
                    value={(user as User)?.balance ?? ''}
                    readOnly={true}
                    startAdornment={
                      <InputAdornment position="start"> € </InputAdornment>
                    }
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="manage profile wallet"
                          color="success"
                          edge="end"
                          onClick={() => setOpen(true)}
                        >
                          <AccountBalanceWalletIcon />
                        </IconButton>
                      </InputAdornment>
                    }
                  />
                  <FormHelperText>{form.errors?.balance}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <Grid
                  container
                  direction="row"
                  columnSpacing={4}
                  rowSpacing={2}
                  gridTemplateColumns="repeat(auto-fill, minmax(20rem, 1fr))"
                >
                  <Grid item xs={12}>
                    <Typography
                      mt="24px"
                      variant="h5"
                      color="primary.main"
                      sx={{ mb: 2, fontWeight: 'bold' }}
                    >
                      Delivery information
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl
                      variant="outlined"
                      fullWidth
                      // error={!!form.errors?.location?.address}
                      disabled={pending}
                    >
                      <InputLabel htmlFor="address">Address</InputLabel>
                      <OutlinedInput
                        id="address"
                        type="text"
                        onChange={form.handleChange}
                        value={form.values.location?.address}
                        label="Address"
                        name="address"
                      />
                      <FormHelperText>
                        {/*{form.errors?.location?.address}*/}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl
                      variant="outlined"
                      fullWidth
                      // error={!!form.errors?.location?.zipCode}
                      disabled={pending}
                    >
                      <InputLabel htmlFor="address">Zip Code</InputLabel>
                      <OutlinedInput
                        id="zipCode"
                        type="number"
                        onChange={form.handleChange}
                        value={form.values.location?.zipCode}
                        label="Zip Code"
                        name="zipCode"
                      />
                      <FormHelperText>
                        {/*{form.errors?.location?.zipCode}*/}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl
                      variant="outlined"
                      fullWidth
                      // error={!!form.errors?.location?.city}
                      disabled={pending}
                    >
                      <InputLabel htmlFor="address">City</InputLabel>
                      <OutlinedInput
                        id="city"
                        type="text"
                        onChange={form.handleChange}
                        value={form.values.location?.city}
                        label="City"
                        name="city"
                      />
                      <FormHelperText>
                        {/*{form.errors?.location?.city}*/}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl
                      variant="outlined"
                      fullWidth
                      // error={!!form.errors?.location?.province}
                      disabled={pending}
                    >
                      <InputLabel htmlFor="address">Province</InputLabel>
                      <OutlinedInput
                        id="province"
                        type="text"
                        onChange={form.handleChange}
                        value={form.values.location?.province}
                        label="Province"
                        name="province"
                      />
                      <FormHelperText>
                        {/*{form.errors?.location?.province}*/}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6} md={4}>
                    <FormControl
                      variant="outlined"
                      fullWidth
                      // error={!!form.errors?.location?.region}
                      disabled={pending}
                    >
                      <InputLabel htmlFor="address">Region</InputLabel>
                      <OutlinedInput
                        id="region"
                        type="text"
                        onChange={form.handleChange}
                        value={form.values.location?.region}
                        label="Region"
                        name="region"
                      />
                      <FormHelperText>
                        {/*{form.errors?.location?.region}*/}
                      </FormHelperText>
                    </FormControl>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </div>
        </Paper>
      </Box>
    </>
  );
};
