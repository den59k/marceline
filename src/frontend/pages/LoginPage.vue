<template>
  <div class="login-page">
    <form class="form-column login-page__form" @submit="apply">
      <h1>Вход в админ-панель</h1>
      <VInput v-bind="register('login')" label="Логин"/>
      <VInput v-bind="register('password')" label="Пароль" type="password"/>
      <VButton type="submit">Войти</VButton>
      <div v-if="errors._global" class="login-page__error-label">{{ errors._global }}</div>
    </form>
  </div>
</template>

<script lang="ts" setup>
import { useForm } from 'vuesix';
import VButton from '../components/VButton.vue';
import VInput from '../components/VInput.vue';
import { accountApi } from '../api/account';
import { useAccountStore } from '../stores/accountStore';
import { useRouter } from 'vue-router';

const { register, handleSubmit, errors } = useForm({
  login: "",
  password: ""
})

const router = useRouter()
const accountStore = useAccountStore()
const apply = handleSubmit(async (values) => {
  const resp = await accountApi.login(values)
  accountStore.authorize(resp)
  router.push("/")
})

</script>

<style lang="sass">
.login-page
  flex: 1 1 auto
  display: flex
  flex-direction: column
  align-items: center
  justify-content: center

.login-page__form
  position: relative
  width: 322px
  h1
    margin: 0

  .v-button
    justify-content: center

.login-page__error-label
  height: 0px
  font-size: 13px
  color: var(--error-color)
  text-align: center
  position: absolute
  bottom: -6px
  width: 100%

</style>